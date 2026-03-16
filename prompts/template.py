def template():
    return {
        "platform": "Youtube Long Form",
        "topic": "Google AI untuk usaha kecil dan menengah",
        "format": {
            "hook": "thought-provoking question",
            "content": "3 actionable tips",
            "engagement": "Ask for audience input"
        },
        "audience": "small and medium business owners",
        "length": "under 250 words",
        "tone": "motivational and practical",
        "negative_prompt": "Avoid generic advice and clichés.",
        "language": "Indonesian"
    }

{
  "task": "Write a YouTube long-form video script",
  "platform": "YouTube",
  "topic": "Pemanfaatan Google AI untuk UMKM secara praktis",
  "audience": "Pengguna AI di bisnis kecil dan menengah yang mencari penerapan nyata tanpa jargon berlebihan",
  "length": "1000 words",
  "tone": "practical, clear, technical but accessible",
  "format": {
    "structure": [
      "Strong hook in the form of a thought-provoking question",
      "3 detailed and actionable tips",
      "Each tip must contain at least 2 concrete examples",
      "Each tip must explain benefits clearly",
      "Each tip must have at least 3 paragraphs (short, clear)",
      "Closing section with a grounded call-to-action and a question for audience"
    ],
    "engagement": "End by asking a specific question to the audience"
  },
  "style": {
    "use_examples": true,
    "avoid": [
      "generic advice",
      "marketing clichés",
      "claims like 'mengubah hidup' atau 'membuat bisnis meledak'"
    ],
    "include": [
      "realistic use-cases",
      "clear benefits",
      "simple language",
      "technical clarity without hype"
    ]
  },
  "language": "Indonesian"
}