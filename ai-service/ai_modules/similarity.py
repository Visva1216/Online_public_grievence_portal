"""
Semantic similarity detector for duplicate complaint detection.
"""

import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)


class SimilarityDetector:
    """
    Computes semantic similarity between complaint texts.
    Uses sentence-transformers for embedding-based similarity,
    falls back to TF-IDF cosine similarity.
    """

    def __init__(self):
        self._sentence_model = None
        self._try_load_model()

    def _try_load_model(self):
        try:
            from sentence_transformers import SentenceTransformer
            logger.info("Loading sentence transformer model...")
            self._sentence_model = SentenceTransformer('paraphrase-MiniLM-L6-v2')
            logger.info("Sentence transformer loaded")
        except Exception as e:
            logger.warning(f"Could not load sentence transformer: {e}. Using TF-IDF fallback.")

    def compute_similarity(self, text1: str, text2: str) -> Dict[str, Any]:
        """Compute similarity score between two texts."""
        if self._sentence_model:
            return self._semantic_similarity(text1, text2)
        return self._tfidf_similarity(text1, text2)

    def _semantic_similarity(self, text1: str, text2: str) -> Dict[str, Any]:
        """Embedding-based cosine similarity."""
        try:
            import numpy as np
            embeddings = self._sentence_model.encode([text1, text2])
            # Cosine similarity
            cos_sim = float(np.dot(embeddings[0], embeddings[1]) /
                           (np.linalg.norm(embeddings[0]) * np.linalg.norm(embeddings[1])))
            return {
                "similarity": round(cos_sim, 4),
                "method": "sentence-transformer",
                "is_duplicate": cos_sim > 0.75
            }
        except Exception as e:
            logger.error(f"Semantic similarity failed: {e}")
            return self._tfidf_similarity(text1, text2)

    def _tfidf_similarity(self, text1: str, text2: str) -> Dict[str, Any]:
        """TF-IDF based cosine similarity fallback."""
        try:
            from sklearn.feature_extraction.text import TfidfVectorizer
            from sklearn.metrics.pairwise import cosine_similarity

            vectorizer = TfidfVectorizer()
            tfidf_matrix = vectorizer.fit_transform([text1, text2])
            sim = float(cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0])
            return {
                "similarity": round(sim, 4),
                "method": "tfidf",
                "is_duplicate": sim > 0.75
            }
        except Exception as e:
            logger.error(f"TF-IDF similarity failed: {e}")
            # Last resort: Jaccard similarity
            words1 = set(text1.lower().split())
            words2 = set(text2.lower().split())
            intersection = words1 & words2
            union = words1 | words2
            jaccard = len(intersection) / len(union) if union else 0
            return {"similarity": round(jaccard, 4), "method": "jaccard"}
