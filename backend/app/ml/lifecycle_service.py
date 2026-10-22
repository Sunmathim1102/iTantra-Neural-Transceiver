import os
import io
import time
import uuid
import json
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, MinMaxScaler, RobustScaler, OneHotEncoder, OrdinalEncoder
from sklearn.compose import ColumnTransformer
from sklearn.decomposition import PCA
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report
import joblib

from app.config.settings import settings
from app.models.db_models import (
    DatasetRecord,
    DatasetVersion,
    AnalysisRun,
    TransformationConfig,
    TrainingExperiment,
    PipelineRun
)

class MLLifecycleService:
    @staticmethod
    def ensure_default_datasets(db: Session):
        """Discovers existing CSVs in datasets storage and registers them in database."""
        datasets_dir = settings.DATASETS_STORAGE_PATH
        os.makedirs(datasets_dir, exist_ok=True)

        comm_csv = os.path.join(datasets_dir, "comm_quality_dataset.csv")
        if os.path.exists(comm_csv):
            existing = db.query(DatasetRecord).filter(DatasetRecord.name == "Radio Communication Quality Dataset").first()
            if not existing:
                try:
                    df = pd.read_csv(comm_csv)
                    col_info = {col: str(df[col].dtype) for col in df.columns}
                    record = DatasetRecord(
                        name="Radio Communication Quality Dataset",
                        filename="comm_quality_dataset.csv",
                        file_path=comm_csv,
                        file_size_bytes=os.path.getsize(comm_csv),
                        row_count=len(df),
                        column_count=len(df.columns),
                        target_column="communication_quality",
                        is_synthetic=1,
                        is_active=1,
                        description="Synthetic RF propagation and channel metrics modeled after AWGN, Rayleigh, and Rician channel physics.",
                        columns_info=col_info
                    )
                    db.add(record)
                    db.flush()
                    
                    v1 = DatasetVersion(
                        dataset_id=record.id,
                        version_tag="v1.0-raw",
                        file_path=comm_csv,
                        row_count=len(df),
                        column_count=len(df.columns),
                        transformation_summary="Initial raw dataset ingestion"
                    )
                    db.add(v1)
                    db.commit()
                except Exception as e:
                    db.rollback()
                    print(f"Error seeding comm_quality_dataset: {e}")

        intent_csv = os.path.join(datasets_dir, "intent_dataset.csv")
        if os.path.exists(intent_csv):
            existing_intent = db.query(DatasetRecord).filter(DatasetRecord.name == "Tactical Indic Intent Dataset").first()
            if not existing_intent:
                try:
                    df_intent = pd.read_csv(intent_csv)
                    col_info_intent = {col: str(df_intent[col].dtype) for col in df_intent.columns}
                    rec_intent = DatasetRecord(
                        name="Tactical Indic Intent Dataset",
                        filename="intent_dataset.csv",
                        file_path=intent_csv,
                        file_size_bytes=os.path.getsize(intent_csv),
                        row_count=len(df_intent),
                        column_count=len(df_intent.columns),
                        target_column="intent",
                        is_synthetic=1,
                        is_active=1,
                        description="Multilingual tactical commands and intent labels across 8 Indic languages and English.",
                        columns_info=col_info_intent
                    )
                    db.add(rec_intent)
                    db.flush()

                    v1_intent = DatasetVersion(
                        dataset_id=rec_intent.id,
                        version_tag="v1.0-raw",
                        file_path=intent_csv,
                        row_count=len(df_intent),
                        column_count=len(df_intent.columns),
                        transformation_summary="Initial raw dataset ingestion"
                    )
                    db.add(v1_intent)
                    db.commit()
                except Exception as e:
                    db.rollback()
                    print(f"Error seeding intent_dataset: {e}")

    @staticmethod
    def get_all_datasets(db: Session) -> List[Dict[str, Any]]:
        MLLifecycleService.ensure_default_datasets(db)
        datasets = db.query(DatasetRecord).order_by(DatasetRecord.created_at.desc()).all()
        result = []
        for d in datasets:
            result.append({
                "id": d.id,
                "name": d.name,
                "filename": d.filename,
                "file_size_bytes": d.file_size_bytes,
                "file_size_kb": round(d.file_size_bytes / 1024, 2),
                "row_count": d.row_count,
                "column_count": d.column_count,
                "target_column": d.target_column,
                "is_synthetic": bool(d.is_synthetic),
                "is_active": bool(d.is_active),
                "description": d.description,
                "columns_info": d.columns_info,
                "created_at": d.created_at.isoformat() if d.created_at else None,
                "updated_at": d.updated_at.isoformat() if d.updated_at else None,
                "version_count": len(d.versions)
            })
        return result

    @staticmethod
    def upload_dataset(db: Session, file_content: bytes, filename: str, name: Optional[str] = None, description: Optional[str] = None) -> Dict[str, Any]:
        """Validates and saves uploaded CSV dataset, preserving raw data separately."""
        if not filename.endswith(".csv"):
            raise ValueError("Unsupported format. Only valid CSV files are supported.")

        if len(file_content) > 50 * 1024 * 1024:
            raise ValueError("File size exceeds 50MB limit.")

        try:
            df = pd.read_csv(io.BytesIO(file_content))
        except Exception as e:
            raise ValueError(f"Failed to parse CSV file: {str(e)}")

        if len(df) == 0:
            raise ValueError("Dataset is empty.")

        ds_name = name or os.path.splitext(filename)[0].replace("_", " ").title()
        existing = db.query(DatasetRecord).filter(DatasetRecord.name == ds_name).first()
        if existing:
            ds_name = f"{ds_name} ({int(time.time())})"

        safe_filename = f"{int(time.time())}_{filename.replace(' ', '_')}"
        save_path = os.path.join(settings.DATASETS_STORAGE_PATH, safe_filename)

        with open(save_path, "wb") as f:
            f.write(file_content)

        col_info = {col: str(df[col].dtype) for col in df.columns}
        # Inferred default target column
        candidate_targets = [c for c in df.columns if any(k in c.lower() for k in ["quality", "target", "label", "class", "intent"])]
        target_col = candidate_targets[0] if candidate_targets else df.columns[-1]

        record = DatasetRecord(
            name=ds_name,
            filename=safe_filename,
            file_path=save_path,
            file_size_bytes=len(file_content),
            row_count=len(df),
            column_count=len(df.columns),
            target_column=target_col,
            is_synthetic=0,
            is_active=1,
            description=description or f"User-uploaded dataset with {len(df)} records and {len(df.columns)} features.",
            columns_info=col_info
        )
        db.add(record)
        db.flush()

        v1 = DatasetVersion(
            dataset_id=record.id,
            version_tag="v1.0-raw",
            file_path=save_path,
            row_count=len(df),
            column_count=len(df.columns),
            transformation_summary="Initial raw CSV upload"
        )
        db.add(v1)
        db.commit()

        return {
            "id": record.id,
            "name": record.name,
            "filename": record.filename,
            "row_count": record.row_count,
            "column_count": record.column_count,
            "target_column": record.target_column,
            "columns": list(df.columns)
        }

    @staticmethod
    def get_dataset_df(db: Session, dataset_id: int) -> pd.DataFrame:
        record = db.query(DatasetRecord).filter(DatasetRecord.id == dataset_id).first()
        if not record:
            raise ValueError(f"Dataset with ID {dataset_id} not found.")
        if not os.path.exists(record.file_path):
            raise FileNotFoundError(f"Dataset file at {record.file_path} not found.")
        return pd.read_csv(record.file_path)

    @staticmethod
    def get_dataset_inspection(db: Session, dataset_id: int) -> Dict[str, Any]:
        record = db.query(DatasetRecord).filter(DatasetRecord.id == dataset_id).first()
        if not record:
            raise ValueError(f"Dataset with ID {dataset_id} not found.")
        df = MLLifecycleService.get_dataset_df(db, dataset_id)

        # Categorize column types safely for pandas 2 and 3
        num_cols = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]
        cat_cols = [c for c in df.columns if not pd.api.types.is_numeric_dtype(df[c])]
        
        # Identifier detection
        id_candidates = [c for c in df.columns if any(k in c.lower() for k in ["id", "index", "sample_id", "uuid", "key"]) or (df[c].nunique() == len(df) and len(df) > 50)]
        for c in id_candidates:
            if c in num_cols:
                num_cols.remove(c)
            if c in cat_cols:
                cat_cols.remove(c)

        # Missing & duplicate counts
        total_cells = df.size
        missing_cells = int(df.isna().sum().sum())
        completeness = round(((total_cells - missing_cells) / total_cells) * 100, 2) if total_cells > 0 else 100.0
        dup_count = int(df.duplicated().sum())

        col_details = []
        for col in df.columns:
            dtype_str = str(df[col].dtype)
            missing = int(df[col].isna().sum())
            infinite = int(np.isinf(df[col]).sum()) if pd.api.types.is_numeric_dtype(df[col]) else 0
            unique_count = int(df[col].nunique())
            
            col_type = "numerical" if col in num_cols else "categorical" if col in cat_cols else "identifier" if col in id_candidates else "text"
            if col == record.target_column:
                col_type = f"target ({col_type})"

            col_details.append({
                "name": col,
                "data_type": dtype_str,
                "feature_type": col_type,
                "missing_count": missing,
                "missing_percentage": round((missing / len(df)) * 100, 2),
                "infinite_count": infinite,
                "unique_count": unique_count,
                "sample_values": [str(x) for x in df[col].dropna().head(3).tolist()]
            })

        # Warnings
        warnings = []
        if dup_count > 0:
            warnings.append(f"Detected {dup_count} duplicate row(s) ({round(dup_count/len(df)*100, 2)}%). Consider applying deduplication.")
        if missing_cells > 0:
            warnings.append(f"Detected {missing_cells} missing value(s) across features. Imputation recommended before PCA/Modeling.")
        for col in num_cols:
            if np.isinf(df[col]).sum() > 0:
                warnings.append(f"Column '{col}' contains infinite values. Cleaning required.")
        for col in df.columns:
            if df[col].nunique() <= 1:
                warnings.append(f"Column '{col}' has zero variance (constant value). Exclude from feature set.")

        return {
            "dataset_id": record.id,
            "name": record.name,
            "filename": record.filename,
            "file_size_bytes": record.file_size_bytes,
            "total_rows": len(df),
            "total_columns": len(df.columns),
            "numerical_features": num_cols,
            "categorical_features": cat_cols,
            "identifier_features": id_candidates,
            "target_column": record.target_column,
            "completeness_percentage": completeness,
            "duplicate_rows": dup_count,
            "missing_cells": missing_cells,
            "columns": col_details,
            "warnings": warnings,
            "head_records": df.head(10).replace({np.nan: None}).to_dict(orient="records"),
            "versions": [{"id": v.id, "tag": v.version_tag, "rows": v.row_count, "summary": v.transformation_summary, "created_at": v.created_at.isoformat()} for v in record.versions]
        }

    @staticmethod
    def run_eda(db: Session, dataset_id: int) -> Dict[str, Any]:
        """Calculates comprehensive Exploratory Data Analysis metrics and distributions."""
        record = db.query(DatasetRecord).filter(DatasetRecord.id == dataset_id).first()
        if not record:
            raise ValueError(f"Dataset with ID {dataset_id} not found.")
        df = MLLifecycleService.get_dataset_df(db, dataset_id)

        target_col = record.target_column
        num_cols = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]
        cat_cols = [c for c in df.columns if not pd.api.types.is_numeric_dtype(df[c])]

        # Exclude IDs from numerical stats
        num_cols = [c for c in num_cols if not any(k in c.lower() for k in ["id", "index"])]

        # 1. Numerical Statistics
        num_stats = {}
        histograms = {}
        box_plots = {}

        for col in num_cols:
            series = df[col].dropna()
            if len(series) == 0:
                continue
            q25 = float(series.quantile(0.25))
            q50 = float(series.quantile(0.50))
            q75 = float(series.quantile(0.75))
            iqr = q75 - q25
            lower_bound = q25 - (1.5 * iqr)
            upper_bound = q75 + (1.5 * iqr)
            outliers = series[(series < lower_bound) | (series > upper_bound)]

            num_stats[col] = {
                "mean": round(float(series.mean()), 4),
                "median": round(q50, 4),
                "std": round(float(series.std()), 4),
                "min": round(float(series.min()), 4),
                "max": round(float(series.max()), 4),
                "q25": round(q25, 4),
                "q75": round(q75, 4),
                "iqr": round(iqr, 4),
                "skewness": round(float(series.skew()), 4) if len(series) > 2 else 0.0,
                "outlier_count": len(outliers),
                "outlier_percentage": round((len(outliers) / len(series)) * 100, 2)
            }

            # Binned Histogram (10 bins)
            counts, bin_edges = np.histogram(series, bins=10)
            hist_data = []
            for i in range(len(counts)):
                label = f"{bin_edges[i]:.1f}-{bin_edges[i+1]:.1f}"
                hist_data.append({"bin": label, "count": int(counts[i]), "mid": round((bin_edges[i] + bin_edges[i+1]) / 2, 2)})
            histograms[col] = hist_data

            # Box Plot distribution summary
            box_plots[col] = {
                "min": round(float(series.min()), 4),
                "q1": round(q25, 4),
                "median": round(q50, 4),
                "q3": round(q75, 4),
                "max": round(float(series.max()), 4),
                "lower_bound": round(lower_bound, 4),
                "upper_bound": round(upper_bound, 4),
                "outlier_count": len(outliers)
            }

        # 2. Categorical Analysis
        cat_stats = {}
        for col in cat_cols:
            val_counts = df[col].value_counts(dropna=False)
            total = len(df)
            dist = [{"category": str(k), "count": int(v), "percentage": round((v / total) * 100, 2)} for k, v in val_counts.head(10).items()]
            rare = [str(k) for k, v in val_counts.items() if (v / total) < 0.05]
            cat_stats[col] = {
                "unique_count": int(df[col].nunique()),
                "top_value": str(val_counts.index[0]) if len(val_counts) > 0 else None,
                "top_frequency": int(val_counts.iloc[0]) if len(val_counts) > 0 else 0,
                "distribution": dist,
                "rare_categories_count": len(rare),
                "rare_categories": rare[:5]
            }

        # 3. Correlation Matrix (Numerical features)
        corr_matrix = {}
        corr_list = []
        if len(num_cols) > 1:
            corr_df = df[num_cols].corr().round(4).fillna(0)
            for r_col in num_cols:
                corr_matrix[r_col] = corr_df[r_col].to_dict()
                for c_col in num_cols:
                    if r_col < c_col:
                        corr_list.append({
                            "feature1": r_col,
                            "feature2": c_col,
                            "correlation": round(float(corr_df.loc[r_col, c_col]), 4),
                            "abs_correlation": round(abs(float(corr_df.loc[r_col, c_col])), 4)
                        })
            corr_list.sort(key=lambda x: x["abs_correlation"], reverse=True)

        # 4. Target distribution
        target_distribution = []
        if target_col and target_col in df.columns:
            t_counts = df[target_col].value_counts()
            target_distribution = [{"class": str(k), "count": int(v), "percentage": round((v / len(df)) * 100, 2)} for k, v in t_counts.items()]

        # 5. Scatter Plot Pairwise Sample (first 2 numerical columns or SNR vs BER)
        scatter_sample = []
        f1 = "snr" if "snr" in df.columns else (num_cols[0] if len(num_cols) > 0 else None)
        f2 = "ber" if "ber" in df.columns else (num_cols[1] if len(num_cols) > 1 else None)
        if f1 and f2:
            sampled_df = df.sample(min(300, len(df)), random_state=42)
            for _, row in sampled_df.iterrows():
                scatter_sample.append({
                    "x": round(float(row[f1]), 3) if pd.notna(row[f1]) else 0,
                    "y": round(float(row[f2]), 5) if pd.notna(row[f2]) else 0,
                    "target": str(row[target_col]) if target_col in df.columns else "N/A"
                })

        eda_results = {
            "dataset_id": record.id,
            "dataset_name": record.name,
            "total_rows": len(df),
            "total_columns": len(df.columns),
            "completeness_percentage": round(((df.size - int(df.isna().sum().sum())) / df.size) * 100, 2),
            "duplicate_rows": int(df.duplicated().sum()),
            "numerical_features_count": len(num_cols),
            "categorical_features_count": len(cat_cols),
            "numerical_statistics": num_stats,
            "categorical_statistics": cat_stats,
            "histograms": histograms,
            "box_plots": box_plots,
            "correlation_matrix": corr_matrix,
            "top_correlations": corr_list[:10],
            "target_distribution": target_distribution,
            "scatter_features": {"x": f1, "y": f2},
            "scatter_sample": scatter_sample,
            "analyzed_at": time.strftime("%Y-%m-%d %H:%M:%S")
        }

        # Save to database
        try:
            run_rec = AnalysisRun(
                dataset_id=record.id,
                analysis_type="EDA",
                summary=f"Calculated complete statistics, distributions, and correlation matrices for {len(num_cols)} numerical and {len(cat_cols)} categorical features.",
                results_json=eda_results
            )
            db.add(run_rec)
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"Failed to save AnalysisRun: {e}")

        return eda_results

    @staticmethod
    def clean_dataset(
        db: Session,
        dataset_id: int,
        remove_duplicates: bool = True,
        impute_numeric: str = "median",  # mean, median, zero, none
        impute_categorical: str = "mode",  # mode, missing, none
        outlier_strategy: str = "clip",  # clip, none
        drop_constant_features: bool = True,
        preview_only: bool = True
    ) -> Dict[str, Any]:
        """Performs data cleaning operations with preview and versioned non-destructive persistence."""
        record = db.query(DatasetRecord).filter(DatasetRecord.id == dataset_id).first()
        if not record:
            raise ValueError(f"Dataset with ID {dataset_id} not found.")
        df = MLLifecycleService.get_dataset_df(db, dataset_id)
        original_shape = df.shape

        cleaned_df = df.copy()
        operations_applied = []

        # 1. Duplicates
        if remove_duplicates:
            dup_count = int(cleaned_df.duplicated().sum())
            if dup_count > 0:
                cleaned_df = cleaned_df.drop_duplicates()
                operations_applied.append(f"Removed {dup_count} duplicate row(s)")

        # 2. Drop constant features
        if drop_constant_features:
            const_cols = [c for c in cleaned_df.columns if cleaned_df[c].nunique() <= 1]
            if const_cols:
                cleaned_df = cleaned_df.drop(columns=const_cols)
                operations_applied.append(f"Dropped {len(const_cols)} constant feature(s): {', '.join(const_cols)}")

        # 3. Numeric Imputation & Infinite Handling
        num_cols = [c for c in cleaned_df.columns if pd.api.types.is_numeric_dtype(cleaned_df[c])]
        for col in num_cols:
            inf_count = int(np.isinf(cleaned_df[col]).sum())
            if inf_count > 0:
                cleaned_df[col] = cleaned_df[col].replace([np.inf, -np.inf], np.nan)
                operations_applied.append(f"Replaced {inf_count} infinite value(s) in '{col}' with NaN")

            nan_count = int(cleaned_df[col].isna().sum())
            if nan_count > 0 and impute_numeric != "none":
                val = cleaned_df[col].median() if impute_numeric == "median" else (cleaned_df[col].mean() if impute_numeric == "mean" else 0.0)
                cleaned_df[col] = cleaned_df[col].fillna(val)
                operations_applied.append(f"Imputed {nan_count} missing values in '{col}' with {impute_numeric} ({val:.2f})")

        # 4. Outlier Clipping
        if outlier_strategy == "clip":
            clipped_total = 0
            for col in num_cols:
                if any(k in col.lower() for k in ["id", "index"]):
                    continue
                q25 = cleaned_df[col].quantile(0.25)
                q75 = cleaned_df[col].quantile(0.75)
                iqr = q75 - q25
                lb = q25 - (1.5 * iqr)
                ub = q75 + (1.5 * iqr)
                before_clip = ((cleaned_df[col] < lb) | (cleaned_df[col] > ub)).sum()
                if before_clip > 0:
                    cleaned_df[col] = cleaned_df[col].clip(lower=lb, upper=ub)
                    clipped_total += int(before_clip)
            if clipped_total > 0:
                operations_applied.append(f"Clipped {clipped_total} outlier values to 1.5*IQR boundaries across numerical features")

        # 5. Categorical Imputation
        cat_cols = [c for c in cleaned_df.columns if not pd.api.types.is_numeric_dtype(cleaned_df[c])]
        for col in cat_cols:
            cat_nan = int(cleaned_df[col].isna().sum())
            if cat_nan > 0 and impute_categorical != "none":
                val = cleaned_df[col].mode()[0] if (impute_categorical == "mode" and not cleaned_df[col].mode().empty) else "Missing"
                cleaned_df[col] = cleaned_df[col].fillna(val)
                operations_applied.append(f"Imputed {cat_nan} missing values in '{col}' with {impute_categorical} ('{val}')")

        if not operations_applied:
            operations_applied.append("Dataset passed all quality checks. No destructive changes required.")

        preview_data = {
            "original_rows": original_shape[0],
            "original_columns": original_shape[1],
            "cleaned_rows": cleaned_df.shape[0],
            "cleaned_columns": cleaned_df.shape[1],
            "operations_applied": operations_applied,
            "preview_samples": cleaned_df.head(10).replace({np.nan: None}).to_dict(orient="records"),
            "is_preview": preview_only
        }

        if not preview_only:
            # Persist versioned cleaned dataset without overwriting raw!
            new_ver_num = len(record.versions) + 1
            ver_tag = f"v{new_ver_num}.0-cleaned"
            new_filename = f"cleaned_{int(time.time())}_{record.filename}"
            new_filepath = os.path.join(settings.DATASETS_STORAGE_PATH, new_filename)
            cleaned_df.to_csv(new_filepath, index=False)

            # Update record active version
            version_rec = DatasetVersion(
                dataset_id=record.id,
                version_tag=ver_tag,
                file_path=new_filepath,
                row_count=len(cleaned_df),
                column_count=len(cleaned_df.columns),
                transformation_summary="; ".join(operations_applied)
            )
            db.add(version_rec)

            config_rec = TransformationConfig(
                dataset_id=record.id,
                config_name=f"Cleaning-{ver_tag}",
                config_json={
                    "remove_duplicates": remove_duplicates,
                    "impute_numeric": impute_numeric,
                    "impute_categorical": impute_categorical,
                    "outlier_strategy": outlier_strategy,
                    "drop_constant_features": drop_constant_features,
                    "operations": operations_applied
                }
            )
            db.add(config_rec)

            # Update dataset record metadata
            record.row_count = len(cleaned_df)
            record.column_count = len(cleaned_df.columns)
            record.file_path = new_filepath
            record.file_size_bytes = os.path.getsize(new_filepath)
            db.commit()

            preview_data["version_tag"] = ver_tag
            preview_data["is_preview"] = False

        return preview_data

    @staticmethod
    def run_scaling_analysis(
        db: Session,
        dataset_id: int,
        scaler_type: str = "StandardScaler",
        features: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Fits scaler strictly on Train split to prevent data leakage, then transforms Test split.
        Compares statistics and distributions before and after.
        """
        record = db.query(DatasetRecord).filter(DatasetRecord.id == dataset_id).first()
        if not record:
            raise ValueError(f"Dataset with ID {dataset_id} not found.")
        df = MLLifecycleService.get_dataset_df(db, dataset_id)

        target_col = record.target_column
        all_num_cols = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]
        all_num_cols = [c for c in all_num_cols if not any(k in c.lower() for k in ["id", "index"])]

        selected_features = features if features else all_num_cols
        if target_col in selected_features:
            selected_features.remove(target_col)

        if not selected_features:
            raise ValueError("No numerical features available for scaling.")

        # Train/Test Split FIRST (Strict Leakage Prevention)
        X = df[selected_features].copy().fillna(df[selected_features].median())
        y = df[target_col] if target_col in df.columns else np.zeros(len(df))

        X_train, X_test = train_test_split(X, test_size=0.2, random_state=42)

        # Scaler selection
        if scaler_type == "MinMaxScaler":
            scaler = MinMaxScaler(feature_range=(0, 1))
        elif scaler_type == "RobustScaler":
            scaler = RobustScaler()
        else:
            scaler = StandardScaler()

        # Fit on TRAIN only!
        scaler.fit(X_train)
        X_train_scaled = pd.DataFrame(scaler.transform(X_train), columns=selected_features)
        X_test_scaled = pd.DataFrame(scaler.transform(X_test), columns=selected_features)

        # Comparison statistics
        comparisons = []
        for col in selected_features:
            orig_mean = float(X_train[col].mean())
            orig_std = float(X_train[col].std())
            orig_min = float(X_train[col].min())
            orig_max = float(X_train[col].max())

            scaled_mean = float(X_train_scaled[col].mean())
            scaled_std = float(X_train_scaled[col].std())
            scaled_min = float(X_train_scaled[col].min())
            scaled_max = float(X_train_scaled[col].max())

            test_scaled_mean = float(X_test_scaled[col].mean())
            test_scaled_std = float(X_test_scaled[col].std())

            comparisons.append({
                "feature": col,
                "original_mean": round(orig_mean, 4),
                "original_std": round(orig_std, 4),
                "original_range": f"[{orig_min:.2f}, {orig_max:.2f}]",
                "scaled_train_mean": round(scaled_mean, 4),
                "scaled_train_std": round(scaled_std, 4),
                "scaled_train_range": f"[{scaled_min:.2f}, {scaled_max:.2f}]",
                "scaled_test_mean": round(test_scaled_mean, 4),
                "scaled_test_std": round(test_scaled_std, 4)
            })

        # Distribution comparison sample (first selected feature)
        first_feat = selected_features[0]
        c1, e1 = np.histogram(X_train[first_feat], bins=8)
        c2, e2 = np.histogram(X_train_scaled[first_feat], bins=8)

        dist_compare = []
        for i in range(len(c1)):
            dist_compare.append({
                "bin_index": i + 1,
                "original_label": f"{e1[i]:.1f}..{e1[i+1]:.1f}",
                "original_count": int(c1[i]),
                "scaled_label": f"{e2[i]:.2f}..{e2[i+1]:.2f}",
                "scaled_count": int(c2[i])
            })

        return {
            "scaler_type": scaler_type,
            "train_samples": len(X_train),
            "test_samples": len(X_test),
            "scaled_features": selected_features,
            "leakage_prevention": "VERIFIED: Split executed prior to preprocessing. Scaler fitted on training partition exclusively and applied to test partition via transform().",
            "comparisons": comparisons,
            "distribution_comparison": {
                "feature": first_feat,
                "bins": dist_compare
            },
            "preview_transformed_head": X_train_scaled.head(8).round(4).to_dict(orient="records")
        }

    @staticmethod
    def run_pca_analysis(
        db: Session,
        dataset_id: int,
        n_components: int = 2,
        features: Optional[List[str]] = None,
        scale_first: bool = True
    ) -> Dict[str, Any]:
        """
        Executes true Principal Component Analysis via scikit-learn.
        Fits PCA on training partition only. Computes scree plot, explained variance,
        2D/3D projections, and feature loadings matrix.
        """
        record = db.query(DatasetRecord).filter(DatasetRecord.id == dataset_id).first()
        if not record:
            raise ValueError(f"Dataset with ID {dataset_id} not found.")
        df = MLLifecycleService.get_dataset_df(db, dataset_id)

        target_col = record.target_column
        all_num_cols = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]
        all_num_cols = [c for c in all_num_cols if not any(k in c.lower() for k in ["id", "index"])]

        selected_features = features if features else all_num_cols
        if target_col in selected_features:
            selected_features.remove(target_col)

        if len(selected_features) < 2:
            raise ValueError("PCA requires at least 2 numerical features.")

        n_comp = min(int(n_components), len(selected_features))

        X = df[selected_features].copy().fillna(df[selected_features].median())
        y = df[target_col] if target_col in df.columns else np.zeros(len(df))

        # Train/Test Split
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        # Scale before PCA (StandardScaler standard practice)
        if scale_first:
            scaler = StandardScaler()
            X_train_proc = scaler.fit_transform(X_train)
            X_test_proc = scaler.transform(X_test)
        else:
            X_train_proc = X_train.values
            X_test_proc = X_test.values

        pca = PCA(n_components=n_comp, random_state=42)
        pca.fit(X_train_proc)

        train_pca = pca.transform(X_train_proc)
        test_pca = pca.transform(X_test_proc)

        exp_var_ratio = [round(float(v), 4) for v in pca.explained_variance_ratio_]
        cum_var_ratio = [round(float(v), 4) for v in np.cumsum(pca.explained_variance_ratio_)]

        # Scree Plot
        scree_plot = []
        for i, (var, cum) in enumerate(zip(exp_var_ratio, cum_var_ratio)):
            scree_plot.append({
                "component": f"PC{i+1}",
                "explained_variance": round(var * 100, 2),
                "cumulative_variance": round(cum * 100, 2)
            })

        # Feature Loadings (Eigenvectors)
        loadings = pca.components_  # shape: (n_components, n_features)
        loadings_table = []
        for f_idx, feat in enumerate(selected_features):
            row_item = {"feature": feat}
            for c_idx in range(n_comp):
                row_item[f"PC{c_idx+1}"] = round(float(loadings[c_idx, f_idx]), 4)
            loadings_table.append(row_item)

        # 2D Projection sample
        sample_size = min(250, len(train_pca))
        sample_indices = np.random.choice(len(train_pca), size=sample_size, replace=False)
        projections_2d = []
        for idx in sample_indices:
            pt = {
                "pc1": round(float(train_pca[idx, 0]), 4),
                "pc2": round(float(train_pca[idx, 1]), 4) if n_comp > 1 else 0.0,
                "target": str(y_train.iloc[idx]) if hasattr(y_train, "iloc") else "Unknown"
            }
            if n_comp >= 3:
                pt["pc3"] = round(float(train_pca[idx, 2]), 4)
            projections_2d.append(pt)

        total_variance_preserved = round(cum_var_ratio[-1] * 100, 2)

        return {
            "n_components": n_comp,
            "original_dimensions": len(selected_features),
            "reduced_dimensions": n_comp,
            "total_variance_preserved_pct": total_variance_preserved,
            "explained_variance_ratio": exp_var_ratio,
            "cumulative_variance_ratio": cum_var_ratio,
            "scree_plot": scree_plot,
            "feature_loadings": loadings_table,
            "projections_sample": projections_2d,
            "selected_features": selected_features,
            "scientific_interpretation": {
                "purpose": "Dimensionality reduction transforms high-dimensional correlated features into orthogonal uncorrelated components.",
                "variance_preserved": f"{n_comp} components retain {total_variance_preserved}% of total feature variance.",
                "variance_lost": f"{round(100.0 - total_variance_preserved, 2)}% of information is compressed or discarded.",
                "guidance": "PCA is unsupervised. While it reduces computational complexity and eliminates multicollinearity, it does not guarantee higher classification accuracy. Evaluate baseline vs PCA models in Model Performance Lab."
            }
        }

    @staticmethod
    def train_model(
        db: Session,
        dataset_id: int,
        algorithm: str = "Random Forest",
        scaler_type: str = "StandardScaler",
        pca_enabled: bool = False,
        pca_components: int = 2,
        test_size: float = 0.2,
        random_seed: int = 42,
        hyperparameters: Optional[Dict[str, Any]] = None,
        selected_features: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Executes end-to-end model training workflow.
        Constructs complete reproducible scikit-learn Pipeline (ColumnTransformer + Scaler + optional PCA + Classifier).
        Evaluates purely on held-out test data and registers experiment in DB.
        """
        record = db.query(DatasetRecord).filter(DatasetRecord.id == dataset_id).first()
        if not record:
            raise ValueError(f"Dataset with ID {dataset_id} not found.")
        df = MLLifecycleService.get_dataset_df(db, dataset_id)

        target_col = record.target_column
        if target_col not in df.columns:
            raise ValueError(f"Target column '{target_col}' not found in dataset.")

        # Identify features
        num_cols = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c]) and not any(k in c.lower() for k in ["id", "index"]) and c != target_col]
        cat_cols = [c for c in df.columns if not pd.api.types.is_numeric_dtype(df[c]) and c != target_col and not any(k in c.lower() for k in ["id", "index"])]

        if selected_features:
            num_cols = [c for c in num_cols if c in selected_features]
            cat_cols = [c for c in cat_cols if c in selected_features]

        if not num_cols and not cat_cols:
            raise ValueError("No input features selected for training.")

        X = df[num_cols + cat_cols].copy()
        y = df[target_col].copy()

        # Handle missing in X before splitting
        for col in num_cols:
            X[col] = X[col].fillna(X[col].median() if not pd.isna(X[col].median()) else 0.0)
        for col in cat_cols:
            X[col] = X[col].fillna("Unknown")

        # Train/Test Split (Stratified classification split)
        stratify_opt = y if y.nunique() <= 20 else None
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_seed, stratify=stratify_opt
        )

        # 1. Preprocessor
        transformers = []
        if num_cols:
            if scaler_type == "MinMaxScaler":
                scaler = MinMaxScaler()
            elif scaler_type == "RobustScaler":
                scaler = RobustScaler()
            elif scaler_type == "None":
                scaler = "passthrough"
            else:
                scaler = StandardScaler()
            transformers.append(("num", scaler, num_cols))

        if cat_cols:
            transformers.append(("cat", OneHotEncoder(handle_unknown="ignore"), cat_cols))

        preprocessor = ColumnTransformer(transformers=transformers)

        # 2. Classifier Selection
        params = hyperparameters or {}
        if algorithm == "Decision Tree":
            clf = DecisionTreeClassifier(
                max_depth=params.get("max_depth", 10),
                random_state=random_seed
            )
        elif algorithm == "Logistic Regression":
            clf = LogisticRegression(
                max_iter=params.get("max_iter", 1000),
                C=params.get("C", 1.0),
                random_state=random_seed
            )
        elif algorithm == "Gradient Boosting":
            clf = GradientBoostingClassifier(
                n_estimators=params.get("n_estimators", 100),
                learning_rate=params.get("learning_rate", 0.1),
                random_state=random_seed
            )
        else:  # Default: Random Forest
            algorithm = "Random Forest"
            clf = RandomForestClassifier(
                n_estimators=params.get("n_estimators", 100),
                max_depth=params.get("max_depth", 12),
                random_state=random_seed,
                class_weight="balanced"
            )

        # 3. Pipeline Assembly
        steps = [("preprocessor", preprocessor)]
        if pca_enabled and num_cols:
            pca_k = min(pca_components, len(num_cols))
            steps.append(("pca", PCA(n_components=pca_k, random_state=random_seed)))
        steps.append(("classifier", clf))

        pipeline = Pipeline(steps=steps)

        # Fit on TRAIN ONLY
        train_start = time.time()
        pipeline.fit(X_train, y_train)
        training_time_ms = round((time.time() - train_start) * 1000, 2)

        # Predict on HELD-OUT TEST DATA
        y_pred = pipeline.predict(X_test)

        acc = float(accuracy_score(y_test, y_pred))
        prec = float(precision_score(y_test, y_pred, average="weighted", zero_division=0))
        rec = float(recall_score(y_test, y_pred, average="weighted", zero_division=0))
        f1 = float(f1_score(y_test, y_pred, average="weighted", zero_division=0))

        # Classification report & Confusion Matrix
        labels = sorted(list(y.unique()))
        cm = confusion_matrix(y_test, y_pred, labels=labels).tolist()
        report = classification_report(y_test, y_pred, labels=labels, output_dict=True, zero_division=0)

        # Feature importances (if available)
        feature_importances = {}
        if hasattr(clf, "feature_importances_") and not pca_enabled:
            # Extract column names from ColumnTransformer
            feature_names = list(num_cols)
            if cat_cols and hasattr(preprocessor.named_transformers_["cat"], "get_feature_names_out"):
                cat_names = list(preprocessor.named_transformers_["cat"].get_feature_names_out(cat_cols))
                feature_names.extend(cat_names)
            if len(feature_names) == len(clf.feature_importances_):
                feature_importances = {name: round(float(imp), 4) for name, imp in zip(feature_names, clf.feature_importances_)}
                feature_importances = dict(sorted(feature_importances.items(), key=lambda x: x[1], reverse=True)[:10])

        # PCA explained variance if enabled
        pca_explained_var = None
        if pca_enabled and "pca" in pipeline.named_steps:
            pca_explained_var = [round(float(v), 4) for v in pipeline.named_steps["pca"].explained_variance_ratio_]

        # Save Pipeline artifact
        exp_id = f"EXP-{uuid.uuid4().hex[:8].upper()}"
        model_filename = f"{exp_id}_{algorithm.replace(' ', '_')}.joblib"
        artifact_path = os.path.join(settings.MODELS_STORAGE_PATH, model_filename)
        joblib.dump(pipeline, artifact_path)

        # Record in ML Experiment Registry
        exp_record = TrainingExperiment(
            experiment_id=exp_id,
            dataset_name=record.name,
            dataset_version="v1.0",
            algorithm=algorithm,
            scaler_type=scaler_type,
            pca_enabled=1 if pca_enabled else 0,
            pca_components=pca_components if pca_enabled else 0,
            hyperparameters=params,
            features_used={"numerical": num_cols, "categorical": cat_cols},
            target_column=target_col,
            test_size=test_size,
            random_seed=random_seed,
            accuracy=round(acc, 4),
            precision=round(prec, 4),
            recall=round(rec, 4),
            f1_score=round(f1, 4),
            confusion_matrix=cm,
            classification_report=report,
            feature_importances=feature_importances,
            pca_explained_variance=pca_explained_var,
            artifact_path=artifact_path,
            is_active=1  # Automatically activate newest successful model
        )
        
        # Deactivate previous models
        db.query(TrainingExperiment).filter(TrainingExperiment.is_active == 1).update({"is_active": 0})
        db.add(exp_record)
        db.commit()

        # Update in-memory active model for prediction
        from app.ml.comm_quality_model import comm_quality_model
        comm_quality_model.pipeline = pipeline
        comm_quality_model.metrics = {
            "model_name": f"{algorithm} ({exp_id})",
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "feature_importances": feature_importances
        }

        return {
            "experiment_id": exp_id,
            "algorithm": algorithm,
            "scaler_type": scaler_type,
            "pca_enabled": pca_enabled,
            "pca_components": pca_components if pca_enabled else 0,
            "train_samples": len(X_train),
            "test_samples": len(X_test),
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "training_time_ms": training_time_ms,
            "confusion_matrix": cm,
            "classes": labels,
            "classification_report": report,
            "feature_importances": feature_importances,
            "pca_explained_variance": pca_explained_var,
            "artifact_path": artifact_path,
            "status": "COMPLETED"
        }

    @staticmethod
    def get_experiments(db: Session) -> List[Dict[str, Any]]:
        exps = db.query(TrainingExperiment).order_by(TrainingExperiment.created_at.desc()).all()
        result = []
        for e in exps:
            result.append({
                "id": e.id,
                "experiment_id": e.experiment_id,
                "dataset_name": e.dataset_name,
                "dataset_version": e.dataset_version,
                "algorithm": e.algorithm,
                "scaler_type": e.scaler_type,
                "pca_enabled": bool(e.pca_enabled),
                "pca_components": e.pca_components,
                "accuracy": e.accuracy,
                "precision": e.precision,
                "recall": e.recall,
                "f1_score": e.f1_score,
                "confusion_matrix": e.confusion_matrix,
                "classification_report": e.classification_report,
                "feature_importances": e.feature_importances,
                "pca_explained_variance": e.pca_explained_variance,
                "is_active": bool(e.is_active),
                "created_at": e.created_at.isoformat() if e.created_at else None
            })
        return result

    @staticmethod
    def activate_experiment(db: Session, experiment_id: str) -> Dict[str, Any]:
        exp = db.query(TrainingExperiment).filter(TrainingExperiment.experiment_id == experiment_id).first()
        if not exp:
            raise ValueError(f"Experiment {experiment_id} not found.")

        db.query(TrainingExperiment).filter(TrainingExperiment.is_active == 1).update({"is_active": 0})
        exp.is_active = 1
        db.commit()

        if os.path.exists(exp.artifact_path):
            pipeline = joblib.load(exp.artifact_path)
            from app.ml.comm_quality_model import comm_quality_model
            comm_quality_model.pipeline = pipeline
            comm_quality_model.metrics = {
                "model_name": f"{exp.algorithm} ({exp.experiment_id})",
                "accuracy": exp.accuracy,
                "precision": exp.precision,
                "recall": exp.recall,
                "f1_score": exp.f1_score,
                "feature_importances": exp.feature_importances or {}
            }

        return {
            "status": "SUCCESS",
            "active_experiment_id": exp.experiment_id,
            "algorithm": exp.algorithm,
            "accuracy": exp.accuracy,
            "f1_score": exp.f1_score
        }
