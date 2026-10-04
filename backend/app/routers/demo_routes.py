from fastapi import APIRouter

router = APIRouter(prefix="/demo", tags=["Demo Mode & Samples"])

DEMO_SAMPLES = [
    {
        "id": "sample-hi-01",
        "language": "Hindi",
        "language_code": "hi",
        "text": "आपातकालीन स्थिति! सेक्टर 4 में प्राथमिक रेडियो ट्रांससीवर चैनल में रुकावट आ रही है, तुरंत बैकअप फ्रीक्वेंसी पर स्विच करें।",
        "suggested_target": "en",
        "default_snr": 12.0,
        "channel_type": "AWGN",
        "modulation": "BPSK",
        "expected_intent": "Emergency"
    },
    {
        "id": "sample-ta-02",
        "language": "Tamil",
        "language_code": "ta",
        "text": "அனைத்து அமைப்புகளும் சீராக இயங்குகின்றன, விமானம் சரியான திசையில் பயணிக்கிறது, ரேடியோ சிக்னல் தெளிவாக உள்ளது.",
        "suggested_target": "en",
        "default_snr": 25.0,
        "channel_type": "AWGN",
        "modulation": "QPSK",
        "expected_intent": "Status Update"
    },
    {
        "id": "sample-te-03",
        "language": "Telugu",
        "language_code": "te",
        "text": "ట్రాన్స్‌సీవర్ ఫ్రీక్వెన్సీ 2.45 GHz మరియు QPSK మాడ్యులేషన్ క్యాలిబ్రేట్ చేయబడింది, సిగ్నల్ శక్తి సరిగ్గా ఉంది.",
        "suggested_target": "en",
        "default_snr": 20.0,
        "channel_type": "Rayleigh",
        "modulation": "QPSK",
        "expected_intent": "Technical"
    },
    {
        "id": "sample-kn-04",
        "language": "Kannada",
        "language_code": "kn",
        "text": "ದಯವಿಟ್ಟು ಮುಂದಿನ ಏರ್‌ಸ್ಪೇಸ್ ಪ್ರವೇಶಿಸಲು ಅನುಮತಿ ನೀಡಿ, ನಾವು ನಿಗದಿತ ಎತ್ತರದಲ್ಲಿ ಹಾರುತ್ತಿದ್ದೇವೆ.",
        "suggested_target": "en",
        "default_snr": 18.0,
        "channel_type": "AWGN",
        "modulation": "BPSK",
        "expected_intent": "Request"
    },
    {
        "id": "sample-ml-05",
        "language": "Malayalam",
        "language_code": "ml",
        "text": "മുന്നറിയിപ്പ്: മലയോര മേഖലയിൽ കനത്ത മൂടൽമഞ്ഞും ദൃശ്യപരിമിതിയും ഉണ്ട്, റഡാർ നിരീക്ഷണം തുടരുക.",
        "suggested_target": "en",
        "default_snr": 9.0,
        "channel_type": "Rayleigh",
        "modulation": "BPSK",
        "expected_intent": "Warning"
    },
    {
        "id": "sample-bn-06",
        "language": "Bengali",
        "language_code": "bn",
        "text": "বর্তমান অবস্থান: 22 ডিগ্রি উত্তর, 88 ডিগ্রি পূর্ব, ক্রুজিং গতি স্বাভাবিক এবং জিপিএস সিগন্যাল লক করা আছে।",
        "suggested_target": "en",
        "default_snr": 22.0,
        "channel_type": "AWGN",
        "modulation": "QPSK",
        "expected_intent": "Navigation"
    },
    {
        "id": "sample-mr-07",
        "language": "Marathi",
        "language_code": "mr",
        "text": "शुभ प्रभात बेस स्टेशन, ऑडिओ फ्रिक्वेन्सी चाचणी यशस्वी झाली आहे, सर्व संदेश स्पष्ट येत आहेत.",
        "suggested_target": "en",
        "default_snr": 26.0,
        "channel_type": "AWGN",
        "modulation": "BPSK",
        "expected_intent": "Normal Communication"
    },
    {
        "id": "sample-en-08",
        "language": "English",
        "language_code": "en",
        "text": "Control tower, this is iTantra tactical aerial unit. Radio access network synchronized and ready for transmission.",
        "suggested_target": "hi",
        "default_snr": 22.0,
        "channel_type": "AWGN",
        "modulation": "BPSK",
        "expected_intent": "Normal Communication"
    }
]

@router.get("/samples")
def get_demo_samples():
    return {
        "description": "Pre-configured Indian multilingual test payloads for Viva & offline demonstration",
        "samples": DEMO_SAMPLES
    }
