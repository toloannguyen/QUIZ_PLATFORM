import re
import pandas as pd
import string


def to_lowercase(text):
    if pd.isnull(text):
        return ""
    return str(text).lower()


def clean_whitespace(text):
    if pd.isnull(text):
        return ""
    text = str(text).strip()
    text = re.sub(r'\s+', ' ', text)
    return text


def remove_punctuation(text):
    if pd.isnull(text):
        return ""
    punctuation_to_remove = string.punctuation.replace('%', '')
    translator = str.maketrans('', '', punctuation_to_remove)
    return str(text).translate(translator)


def clean_text(text):
    if pd.isnull(text):
        return ""

    text = str(text)
    text = to_lowercase(text)
    text = remove_punctuation(text)
    text = clean_whitespace(text)

    return text


def is_empty_answer(text):
    if pd.isnull(text):
        return True
    return text.strip() == ""