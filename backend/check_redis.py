from dotenv import load_dotenv

load_dotenv()

from redis_client import redis_client


print("Redis keys:")

cursor = 0

while True:
    cursor, keys = redis_client.scan(
        cursor=cursor,
        match="*",
        count=100,
    )

    for key in keys:
        if isinstance(key, bytes):
            key = key.decode()

        value = redis_client.get(key)

        if isinstance(value, bytes):
            value = value.decode()

        print(f"{key} -> {value}")

    if cursor == 0:
        break