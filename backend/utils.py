ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"


def encode_base62(number: int) -> str:
    if number == 0:
        return ALPHABET[0]

    characters = []

    while number > 0:
        number, remainder = divmod(number, 62)
        characters.append(ALPHABET[remainder])

    return "".join(reversed(characters))