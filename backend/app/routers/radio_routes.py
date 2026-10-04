from fastapi import APIRouter
from app.radio.transceiver_sim import TransceiverSimulator
from app.schemas.api_schemas import RadioSimulationRequest, RadioSimulationResponse

router = APIRouter(prefix="/radio", tags=["Neural Transceiver Radio Access Simulation"])

@router.post("/simulate", response_model=RadioSimulationResponse)
def simulate_radio_endpoint(req: RadioSimulationRequest):
    return TransceiverSimulator.simulate_transmission(
        message=req.message,
        snr=req.snr,
        carrier_frequency=req.carrier_frequency,
        sampling_rate=req.sampling_rate,
        bit_rate=req.bit_rate,
        channel_type=req.channel_type,
        modulation=req.modulation
    )
