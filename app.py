from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.requests import Request
import json

app = FastAPI()

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Template rendering
templates = Jinja2Templates(directory="templates")

# Dictionary to store connected WebSocket clients and their names
websocket_clients = {}

# WebSocket endpoint for handling client connections
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            data_json = json.loads(data)

            # Handle different message types
            match data_json["type"]:
                case "message":
                    message = data_json["data"]
                    sender_name = websocket_clients.get(websocket, "Unknown")
                    for client in websocket_clients:
                        await client.send_text(json.dumps({"type": "message", "data": f"{sender_name}: {message}"}))

                case "name_request":
                    name = data_json["data"]
                    if name in websocket_clients.values():
                        await websocket.send_text(json.dumps({"type": "name_request_response", "data": name, "bool": False}))
                    else:
                        await websocket.send_text(json.dumps({"type": "name_request_response", "data": name, "bool": True}))

                case "name_new":
                    name = data_json["data"]
                    websocket_clients[websocket] = name
                    for client in websocket_clients:
                        await client.send_text(json.dumps({"type": "message_server", "data": f"{name} has joined the chat!"}))

                case "name_change":
                    name = data_json["data"]
                    old_name = websocket_clients[websocket]
                    websocket_clients[websocket] = name
                    for client in websocket_clients:
                        await client.send_text(json.dumps({"type": "message_server", "data": f"{old_name} has changed their name to {name}!"}))

    except WebSocketDisconnect:
        name = websocket_clients.pop(websocket)
        for client in websocket_clients:
            if (name):
                await client.send_text(json.dumps({"type": "message_server", "data": f"{name} has left the chat."}))
            
# Index route to serve the HTML page
@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

# Chat route to serve the chat page
@app.get("/chat", response_class=HTMLResponse)
async def chat(request: Request):
    return templates.TemplateResponse("chat.html", {"request": request})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
