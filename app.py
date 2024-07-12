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
                    #string handling
                    message = data_json["data"]
                    words = message.split(" ")
                    mentions = []
                    whispers = []
                    for i in words:
                        try:
                            if i[0] == "@":
                                mentions.append(i[1:])
                            if i[0] == "\\":
                                whispers.append(i[1:])
                        except IndexError:
                            pass
                    #distributes messages accordingly
                    sender_name = websocket_clients.get(websocket, "Unknown")["name"]
                    sender_pfp = websocket_clients.get(websocket, "Unknown")["pfp"]
                    #whispers
                    if len(whispers) > 0:
                        for client_name in whispers:
                            client = await get_key_by_value(websocket_clients, client_name)
                            if client!=websocket:
                                await websocket.send_text(json.dumps({"type": "message_whisper", "data": f"{sender_name}: {message}", "icon":sender_pfp}))
                            if client:
                                await client.send_text(json.dumps({"type": "message_whisper", "data": f"{sender_name}: {message}", "icon":sender_pfp}))

                    else:
                        #mentions
                        for client in websocket_clients:
                            client_name = websocket_clients.get(client,"Unknown")["name"]
                            if client_name in mentions:
                                await client.send_text(json.dumps({"type": "message_mention", "data": f"{sender_name}: {message}", "icon":sender_pfp}))
                        #messages
                            else:
                                await client.send_text(json.dumps({"type": "message", "data": f"{sender_name}: {message}", "icon":sender_pfp}))

                case "name_request":
                    name = data_json["data"]
                    if name in websocket_clients.values():
                        await websocket.send_text(json.dumps({"type": "name_request_response", "data": name, "bool": False}))
                    else:
                        await websocket.send_text(json.dumps({"type": "name_request_response", "data": name, "bool": True}))

                case "name_new":
                    name = data_json["data"]
                    pfp = data_json["icon"]
                    websocket_clients[websocket] = {"name":name,"pfp":pfp}
                    for client in websocket_clients:
                        await client.send_text(json.dumps({"type": "message_server", "data": f"{name} has joined the chat!"}))

                case "name_change":
                    name = data_json["data"]
                    pfp = data_json["icon"]
                    old_name = websocket_clients[websocket]["name"]
                    websocket_clients[websocket] = {"name":name,"pfp":pfp}
                    for client in websocket_clients:
                        await client.send_text(json.dumps({"type": "message_server", "data": f"{old_name} has changed their name to {name}!"}))

    except WebSocketDisconnect:
        name = websocket_clients.pop(websocket)["name"]
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

#helper function for finding dictionary key
async def get_key_by_value(d, value):
    for k, v in d.items():
        if v["name"] == value:
            return k
    return None

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)




