import os
import json
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
import joblib

INTENT_DATA = [
    # Emergency
    ("Mayday mayday, we have engine failure and need immediate search and rescue", "Emergency"),
    ("SOS! Vessel is sinking, coordinates 12.9716 N, 77.5946 E", "Emergency"),
    ("Severe medical emergency onboard, requesting immediate airlift evacuation", "Emergency"),
    ("आपातकालीन स्थिति! विमान का इंजन विफल हो गया है, तुरंत सहायता भेजें", "Emergency"),
    ("अत्यंत गंभीर संकट, जीवन रक्षक दल को तुरंत भेजें", "Emergency"),
    ("அவசர நிலை! கப்பல் மூழ்குகிறது, உடனடியாக மீட்புக் குழுவை அனுப்பவும்", "Emergency"),
    ("துரித உதவி தேவை! விபத்து ஏற்பட்டுள்ளது", "Emergency"),
    ("అత్యవసర పరిస్థితి! దయచేసి వెంటనే సహాయం పంపండి", "Emergency"),
    ("ತುರ್ತು ಪರಿಸ್ಥಿತಿ! ತಕ್ಷಣ ರಕ್ಷಣಾ ತಂಡವನ್ನು ಕಳುಹಿಸಿ", "Emergency"),
    ("അടിയന്തര സാഹചര്യം! ഉടൻ രക്ഷാപ്രവർത്തകരെ അയക്കുക", "Emergency"),
    ("জরুরি অবস্থা! অবিলম্বে উদ্ধারকারী দল পাঠান", "Emergency"),
    ("आणीबाणी! तातडीने मदत पाठवा", "Emergency"),
    ("Fire in the auxiliary engine compartment, executing emergency shutdown", "Emergency"),
    ("Loss of cabin pressure, initiating rapid emergency descent", "Emergency"),
    ("Hostile interception detected, calling emergency defense protocol", "Emergency"),

    # Warning
    ("Warning: severe thunderstorm and turbulence reported along flight corridor", "Warning"),
    ("Caution: radio frequency interference detected on primary transponder", "Warning"),
    ("Warning: low fuel reserve, 20 minutes remaining until critical threshold", "Warning"),
    ("चेतावनी: आगामी मार्ग में भारी तूफान और बिजली गिरने की संभावना है", "Warning"),
    ("सावधानी: ईंधन स्तर खतरनाक रूप से कम हो रहा है", "Warning"),
    ("எச்சரிக்கை: கடுமையான புயல் காற்று வீசுகிறது, எச்சரிக்கையாக இருக்கவும்", "Warning"),
    ("ஹெச்சரிக்கை: சிக்னல் இழப்பு ஏற்பட வாய்ப்புள்ளது", "Warning"),
    ("హెచ్చరిక: తీవ్రమైన తుఫాను వస్తోంది", "Warning"),
    ("ಎಚ್ಚರಿಕೆ: ಭಾರೀ ಮಳೆ ಮತ್ತು ಬಿರುಗಾಳಿ ಸಂಭವಿಸಬಹುದು", "Warning"),
    ("മുന്നറിയിപ്പ്: മോശം കാലാവസ്ഥ മുന്നിലുണ്ട്", "Warning"),
    ("সতর্কবার্তা: তীব্র বজ্রঝড় ও প্রতিকূল আবহাওয়া", "Warning"),
    ("इशारा: पुढील मार्गावर वादळ आहे", "Warning"),
    ("Proximity warning: unknown aircraft on collision course 5 miles ahead", "Warning"),
    ("Alert: runway ice formation detected, braking action compromised", "Warning"),
    ("High temperature warning on propulsion subsystem", "Warning"),

    # Normal Communication
    ("Good morning base station, this is flight 402 checking radio clarity", "Normal Communication"),
    ("Roger that control, message received loud and clear, over and out", "Normal Communication"),
    ("Confirming receipt of transmission, everything is running smoothly", "Normal Communication"),
    ("शुभ प्रभात, बेस स्टेशन से संपर्क स्थापित हो गया है", "Normal Communication"),
    ("संदेश प्राप्त हुआ, आवाज स्पष्ट और साफ सुनाई दे रही है", "Normal Communication"),
    ("காலை வணக்கம், தகவல் தெளிவாக கேட்கிறது", "Normal Communication"),
    ("செய்தி பெறப்பட்டது, நன்றி", "Normal Communication"),
    ("శుభోదయం, సమాచారం స్పష్టంగా వినబడుతోంది", "Normal Communication"),
    ("ಶುಭೋದಯ, ಧ್ವನಿ ಸ್ಪಷ್ಟವಾಗಿ ಕೇಳಿಸುತ್ತಿದೆ", "Normal Communication"),
    ("സുപ്രഭാതം, ശബ്ദം വ്യക്തമായി കേൾക്കുന്നുണ്ട്", "Normal Communication"),
    ("সুপ্রভাত, সিগন্যাল স্পষ্ট এবং যোগাযোগ প্রতিষ্ঠিত হয়েছে", "Normal Communication"),
    ("शुभ प्रभात, संदेश व्यवस्थित मिळाला आहे", "Normal Communication"),
    ("Have a good shift team, signing off from post alpha", "Normal Communication"),
    ("All crew members in position and ready for standard briefing", "Normal Communication"),
    ("Acknowledged flight plan update, having normal cruise flight", "Normal Communication"),

    # Technical
    ("Transceiver carrier frequency shifted to 2.45 GHz with QPSK modulation", "Technical"),
    ("Calibrating antenna phase array and checking signal to noise ratio", "Technical"),
    ("Bit error rate elevated to 0.04 due to multi-path Rayleigh fading", "Technical"),
    ("ट्रांससीवर आवृत्ति 2.4 गीगाहर्ट्ज़ पर ट्यून की गई है", "Technical"),
    ("सिग्नल टू नॉइज़ रेशियो की गणना और मॉड्यूलेशन पैरामीटर जांचें", "Technical"),
    ("ரேடியோ அலைவரிசை மற்றும் சிக்னல் தரம் பரிசோதிக்கப்படுகிறது", "Technical"),
    ("தொழில்நுட்ப பிழை சரிசெய்யப்பட்டது", "Technical"),
    ("ట్రాన్స్‌సీవర్ ఫ్రీక్వెన్సీ సెట్ చేయబడింది", "Technical"),
    ("ತಾಂತ್ರಿಕ ದೋಷ ಪರಿಶೀಲನೆ ನಡೆಯುತ್ತಿದೆ", "Technical"),
    ("സാങ്കേതിക തകരാറുകൾ പരിഹരിച്ചു", "Technical"),
    ("ট্রান্সসিভার ক্যারিয়ার ফ্রিকোয়েন্সি সমন্বয় করা হচ্ছে", "Technical"),
    ("तांत्रिक तपासणी पूर्ण झाली आहे", "Technical"),
    ("Testing low-noise amplifier gain and digital down-converter filter response", "Technical"),
    ("Telemetry packet framing error detected in sub-band 3", "Technical"),
    ("Bandwidth allocation configured to 20 MHz channel spacing", "Technical"),

    # Navigation
    ("Requesting heading vector 240 degrees to avoid weather formation", "Navigation"),
    ("Current position: 19 degrees North, 72 degrees East, altitude 32000 feet", "Navigation"),
    ("Direct route waypoint Bravo-6 approved, maintaining flight level 350", "Navigation"),
    ("वर्तमान निर्देशांक: 28.6139 उत्तर, 77.2090 पूर्व, ऊंचाई 10,000 फीट", "Navigation"),
    ("मार्ग परिवर्तन की अनुमति दें, दिशा 180 डिग्री दक्षिण", "Navigation"),
    ("தற்போதைய திசை மற்றும் அமைவிடம் பதிவு செய்யப்பட்டுள்ளது", "Navigation"),
    ("வழிசெலுத்தல் பாதை உறுதி செய்யப்பட்டது", "Navigation"),
    ("ప్రస్తుత దిశ మరియు లొకేషన్ వివరాలు", "Navigation"),
    ("ಪ್ರಸ್ತುತ ಮಾರ್ಗದ ನಿರ್ದೇಶನ ಮತ್ತು ಎತ್ತರ", "Navigation"),
    ("നിലവിലെ സ്ഥാനം രേഖപ്പെടുത്തി", "Navigation"),
    ("বর্তমান স্থানাঙ্ক এবং গতিপথ নিশ্চিত করা হল", "Navigation"),
    ("दिशा आणि मार्ग निश्चित केला आहे", "Navigation"),
    ("Turning left to interception bearing 095, descending to 4000 ft", "Navigation"),
    ("GPS lock confirmed on 12 satellites, accuracy within 2 meters", "Navigation"),
    ("Holding pattern established over beacon Charlie at 6000 feet", "Navigation"),

    # Request
    ("Requesting permission to enter sector 7 airspace immediately", "Request"),
    ("Requesting frequency handoff to regional traffic command", "Request"),
    ("Please authorize emergency landing on runway 27 Right", "Request"),
    ("कृपया सेक्टर 3 में प्रवेश करने की अनुमति प्रदान करें", "Request"),
    ("ईंधन भरने के लिए निकटतम सुरक्षित स्थान की अनुमति दें", "Request"),
    ("அனுமதி வழங்கும்படி கேட்டுக்கொள்கிறோம்", "Request"),
    ("அவசர தரை இறங்க அனுமதி தேவை", "Request"),
    ("దయచేసి అనుమతి ఇవ్వండి", "Request"),
    ("ದಯವಿಟ್ಟು ಪ್ರವೇಶ ಅನುಮತಿ ನೀಡಿ", "Request"),
    ("ദയവായി അനുമതി നൽകുക", "Request"),
    ("অনুগ্রহ করে অবতরনের অনুমতি দিন", "Request"),
    ("कृपया लँडिंगची परवानगी द्यावी", "Request"),
    ("Requesting updated meteorological weather report for destination", "Request"),
    ("Requesting backup transmission channel due to high packet loss", "Request"),
    ("Kindly repeat previous azimuth coordinates for confirmation", "Request"),

    # Status Update
    ("Current status: Fuel at 85%, payload secure, communications nominal", "Status Update"),
    ("All subsystem diagnostics passed, ready for mission deployment", "Status Update"),
    ("Patrol cycle 4 completed without incident, returning to base", "Status Update"),
    ("स्थिति रिपोर्ट: सभी उपकरण सामान्य रूप से काम कर रहे हैं", "Status Update"),
    ("मिशन का पहला चरण सफलतापूर्वक पूरा हो गया है", "Status Update"),
    ("நிலை அறிக்கை: அனைத்து அமைப்புகளும் சீராக இயங்குகின்றன", "Status Update"),
    ("பணி வெற்றிகரமாக முடிந்தது", "Status Update"),
    ("పరిస్థితి నివేదిక: వ్యవస్థలన్నీ సరిగ్గా పనిచేస్తున్నాయి", "Status Update"),
    ("ಸ್ಥಿತಿ ವರದಿ: ಎಲ್ಲಾ ವ್ಯವಸ್ಥೆಗಳು ಸರಿಯಾಗಿ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತಿವೆ", "Status Update"),
    ("സ്ഥിതിവിവരം: എല്ലാ പ്രവർത്തനങ്ങളും സാധാരണ നിലയിലാണ്", "Status Update"),
    ("স্ট্যাটাস আপডেট: সব সিস্টেম স্বাভাবিক রয়েছে", "Status Update"),
    ("स्थिती अहवाल: सर्व कार्य सुरळीत सुरू आहे", "Status Update"),
    ("Checkpoint Delta passed at 14:32 hours, ETA to target 25 minutes", "Status Update"),
    ("Battery backup charging complete, generator load at 42 percent", "Status Update"),
    ("Radio access network traffic load stabilized at 68 percent", "Status Update"),

    # Information
    ("Notice to all units: routine frequency maintenance scheduled at midnight", "Information"),
    ("Broadcast: civilian drone flight restricted within 5 nautical miles", "Information"),
    ("Information bulletin: new encryption keys active from 0600 hours", "Information"),
    ("सूचना: आज रात संचार चैनल का नियमित रखरखाव किया जाएगा", "Information"),
    ("जानकारी: नई सुरक्षा नीति और कोड आज से लागू होंगे", "Information"),
    ("தகவல் அறிவிப்பு: புதிய அலைவரிசை விவரங்கள் வெளியிடப்பட்டுள்ளன", "Information"),
    ("பொது தகவல்: வானிலை சீரடைந்து வருகிறது", "Information"),
    ("సమాచారం: కొత్త నిబంధనలు అమల్లోకి వచ్చాయి", "Information"),
    ("ಮಾಹಿತಿ: ಹೊಸ ಮಾರ್ಗಸೂಚಿಗಳು ಲಭ್ಯವಿದೆ", "Information"),
    ("വിവരം: പുതിയ വിവരങ്ങൾ ലഭ്യമാക്കിയിട്ടുണ്ട്", "Information"),
    ("তথ্য বিজ্ঞপ্তি: নতুন নির্দেশিকা জারি করা হয়েছে", "Information"),
    ("माहिती: नवीन सूचना जारी करण्यात आली आहे", "Information"),
    ("Reference guide updated on tactical dispatch terminal", "Information"),
    ("Advisory: high solar flare activity may cause momentary UHF flicker", "Information"),
    ("Weather advisory: visibility improving to 10 kilometers across sector", "Information")
]

def train_and_save_intent_model():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    models_dir = os.path.join(base_dir, "backend", "models")
    datasets_dir = os.path.join(base_dir, "backend", "datasets")
    os.makedirs(models_dir, exist_ok=True)
    os.makedirs(datasets_dir, exist_ok=True)

    # Synthesize additional variations for robust learning
    texts, labels = [], []
    for text, label in INTENT_DATA:
        texts.append(text)
        labels.append(label)
        # Synthesize punctuation and upper/lower variations
        texts.append(text.upper())
        labels.append(label)
        texts.append(f"Transmission log: {text}")
        labels.append(label)

    df = pd.DataFrame({"text": texts, "intent": labels})
    df.to_csv(os.path.join(datasets_dir, "intent_dataset.csv"), index=False)
    print(f"Saved dataset with {len(df)} samples.")

    X_train, X_test, y_train, y_test = train_test_split(df["text"], df["intent"], test_size=0.25, random_state=42, stratify=df["intent"])

    vectorizer = TfidfVectorizer(ngram_range=(1, 2), max_features=2500, sublinear_tf=True)
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)

    clf = LogisticRegression(max_iter=1000, C=5.0, class_weight='balanced')
    clf.fit(X_train_vec, y_train)

    y_pred = clf.predict(X_test_vec)

    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred, average="weighted", zero_division=0))
    rec = float(recall_score(y_test, y_pred, average="weighted", zero_division=0))
    f1 = float(f1_score(y_test, y_pred, average="weighted", zero_division=0))
    cm = confusion_matrix(y_test, y_pred, labels=clf.classes_).tolist()
    report = classification_report(y_test, y_pred, output_dict=True, zero_division=0)

    # Top features per class
    feature_names = np.array(vectorizer.get_feature_names_out())
    top_features_per_class = {}
    for i, class_label in enumerate(clf.classes_):
        top_indices = np.argsort(clf.coef_[i])[-5:]
        top_features_per_class[class_label] = feature_names[top_indices].tolist()

    # Save model artifacts
    pipeline = {
        "vectorizer": vectorizer,
        "classifier": clf,
        "classes": clf.classes_.tolist()
    }
    joblib.dump(pipeline, os.path.join(models_dir, "intent_model.joblib"))

    metrics_summary = {
        "model_name": "TF-IDF + Logistic Regression Intent Classifier",
        "algorithm": "Multinomial Logistic Regression (L2 Regularized)",
        "total_samples": len(df),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "classes": clf.classes_.tolist(),
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4),
        "confusion_matrix": cm,
        "classification_report": report,
        "top_features": top_features_per_class
    }
    
    with open(os.path.join(models_dir, "intent_metrics.json"), "w", encoding="utf-8") as f:
        json.dump(metrics_summary, f, indent=2, ensure_ascii=False)

    print(f"Intent model trained successfully! Test Accuracy: {acc*100:.2f}%, F1-Score: {f1*100:.2f}%")

if __name__ == "__main__":
    train_and_save_intent_model()
