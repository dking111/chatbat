let socket;

window.onload = function() {
    const path = window.location.pathname;

    if (path === '/') {
        // Index page logic
        document.getElementById("joinChatButton").onclick = function() {
            var nameInput = document.getElementById("nameInput");
            var name = nameInput.value;
            if (name) {
                localStorage.setItem("chatName", name);  // Store the name in localStorage
                window.location.href = "/chat";  // Redirect to the chat page
            } else {
                alert("Name is required to join the chat.");
            }
        };
    } else if (path === '/chat') {
        // Chat page logic
        const name = localStorage.getItem("chatName");
        if (name) {
            socket = new WebSocket("ws://" + window.location.host + "/ws");

            socket.onopen = function(event) {
                socket.send(name);
            };

            socket.onmessage = function(event) {
                const messagesUl = document.getElementById("messages");
                if (messagesUl) {
                    const li = document.createElement("li");
                    li.innerText = event.data;
                    messagesUl.appendChild(li);
                    // Ensure the list has at most 10 messages
                    while (messagesUl.getElementsByTagName("li").length > 10) {
                        messagesUl.removeChild(messagesUl.firstChild);
                    }
                }
            };

            socket.onclose = function(event) {
                console.log("Connection closed");
            };

            socket.onerror = function(error) {
                console.error("WebSocket error:", error);
            };

        } else {
            window.location.href = "/";  // Redirect to the name entry page if no name is found
        }
    }
};

function sendName(){
    var nameInput = document.getElementById("nameInput");
    var name = nameInput.value;
    if (name) {
        localStorage.setItem("chatName", name);  // Store the name in localStorage
        window.location.href = "/chat";  // Redirect to the chat page
    } else {
        alert("Name is required to join the chat.");
    }
}

function sendMessage(){
    var messageInput = document.getElementById("messageInput");
    var message = messageInput.value;
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(message);
        messageInput.value = "";
    }
}
