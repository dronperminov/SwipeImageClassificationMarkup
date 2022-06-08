import json
import uvicorn


if __name__ == "__main__":
    with open("config.json", encoding="utf-8") as f:
        config = json.load(f)

    port = config.get("port", 8000)
    host = config.get("host", "0.0.0.0")
    uvicorn.run("api.api:app", host=host, port=port, reload=True)
