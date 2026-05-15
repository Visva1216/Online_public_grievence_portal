"""
Delhi Grievance Portal - AI Microservice
Python Flask application providing:
- NLP Complaint Categorization
- Priority Detection
- Image Analysis (Computer Vision)
- Language Translation
- Duplicate Similarity Detection
"""

import os
import logging
import traceback
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# ─────────────────────────────────────────────────────────────
# Lazy-load heavy models
# ─────────────────────────────────────────────────────────────
_categorizer = None
_image_analyzer = None
_similarity_model = None


def get_categorizer():
    global _categorizer
    if _categorizer is None:
        from ai_modules.categorizer import ComplaintCategorizer
        _categorizer = ComplaintCategorizer()
        logger.info("Categorizer loaded")
    return _categorizer


def get_image_analyzer():
    global _image_analyzer
    if _image_analyzer is None:
        from ai_modules.image_analyzer import ImageAnalyzer
        _image_analyzer = ImageAnalyzer()
        logger.info("Image analyzer loaded")
    return _image_analyzer


def get_similarity_model():
    global _similarity_model
    if _similarity_model is None:
        from ai_modules.similarity import SimilarityDetector
        _similarity_model = SimilarityDetector()
        logger.info("Similarity model loaded")
    return _similarity_model


# ─────────────────────────────────────────────────────────────
# Health Check
# ─────────────────────────────────────────────────────────────
@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "service": "Delhi Grievance AI Service", "version": "1.0.0"})


# ─────────────────────────────────────────────────────────────
# Categorize complaint text
# ─────────────────────────────────────────────────────────────
@app.route('/ai/categorize', methods=['POST'])
def categorize():
    try:
        data = request.get_json()
        text = data.get('text', '')
        language = data.get('language', 'en')

        if not text:
            return jsonify({"error": "text is required"}), 400

        categorizer = get_categorizer()
        result = categorizer.categorize(text, language)
        logger.info(f"Categorized: category={result['category']}, confidence={result['confidence']:.3f}")
        return jsonify(result)
    except Exception as e:
        logger.error(f"Categorization error: {e}\n{traceback.format_exc()}")
        return jsonify({"category": "OTHER", "confidence": 0.5, "method": "fallback"}), 200


# ─────────────────────────────────────────────────────────────
# Priority detection
# ─────────────────────────────────────────────────────────────
@app.route('/ai/priority', methods=['POST'])
def detect_priority():
    try:
        data = request.get_json()
        text = data.get('text', '')

        if not text:
            return jsonify({"error": "text is required"}), 400

        categorizer = get_categorizer()
        result = categorizer.detect_priority(text)
        logger.info(f"Priority detected: {result['priority']}, confidence={result['confidence']:.3f}")
        return jsonify(result)
    except Exception as e:
        logger.error(f"Priority detection error: {e}")
        return jsonify({"priority": "MEDIUM", "confidence": 0.5}), 200


# ─────────────────────────────────────────────────────────────
# Image analysis
# ─────────────────────────────────────────────────────────────
@app.route('/ai/analyze-image', methods=['POST'])
def analyze_image():
    try:
        if 'image' not in request.files:
            return jsonify({"error": "image file required"}), 400

        image_file = request.files['image']
        image_bytes = image_file.read()

        analyzer = get_image_analyzer()
        result = analyzer.analyze(image_bytes, image_file.filename)
        logger.info(f"Image analyzed: tags={result.get('tags', [])}")
        return jsonify(result)
    except Exception as e:
        logger.error(f"Image analysis error: {e}\n{traceback.format_exc()}")
        return jsonify({"tags": [], "category_suggestion": "OTHER", "confidence": 0.0}), 200


# ─────────────────────────────────────────────────────────────
# Language translation
# ─────────────────────────────────────────────────────────────
@app.route('/ai/translate', methods=['POST'])
def translate():
    try:
        data = request.get_json()
        text = data.get('text', '')
        source_lang = data.get('source_language', 'auto')
        target_lang = data.get('target_language', 'en')

        if not text:
            return jsonify({"translated_text": text}), 200

        from deep_translator import GoogleTranslator
        translator = GoogleTranslator(source=source_lang, target=target_lang)
        translated = translator.translate(text)
        return jsonify({
            "original_text": text,
            "translated_text": translated,
            "source_language": source_lang,
            "target_language": target_lang
        })
    except Exception as e:
        logger.error(f"Translation error: {e}")
        return jsonify({"original_text": text, "translated_text": text}), 200


# ─────────────────────────────────────────────────────────────
# Text similarity (duplicate detection)
# ─────────────────────────────────────────────────────────────
@app.route('/ai/similarity', methods=['POST'])
def similarity():
    try:
        data = request.get_json()
        text1 = data.get('text1', '')
        text2 = data.get('text2', '')

        if not text1 or not text2:
            return jsonify({"similarity": 0.0}), 200

        detector = get_similarity_model()
        result = detector.compute_similarity(text1, text2)
        return jsonify(result)
    except Exception as e:
        logger.error(f"Similarity error: {e}")
        return jsonify({"similarity": 0.0}), 200


# ─────────────────────────────────────────────────────────────
# Voice to text (placeholder endpoint - uses browser Web Speech API)
# ─────────────────────────────────────────────────────────────
@app.route('/ai/voice-to-text', methods=['POST'])
def voice_to_text():
    """
    Processes uploaded voice file and returns transcription.
    In production, integrate with Google Cloud Speech-to-Text or
    OpenAI Whisper for accurate transcription.
    """
    try:
        if 'audio' not in request.files:
            return jsonify({"error": "audio file required"}), 400

        audio_file = request.files['audio']
        audio_bytes = audio_file.read()

        # Placeholder: In production replace with actual STT implementation
        # e.g., using openai-whisper:
        # import whisper
        # model = whisper.load_model("base")
        # result = model.transcribe(audio_path)
        # transcription = result["text"]

        return jsonify({
            "transcription": "Voice transcription service - integrate with Whisper or Google STT",
            "language": "en",
            "confidence": 0.9
        })
    except Exception as e:
        logger.error(f"Voice-to-text error: {e}")
        return jsonify({"transcription": "", "error": str(e)}), 500


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'
    logger.info(f"Starting Delhi Grievance AI Service on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug)
