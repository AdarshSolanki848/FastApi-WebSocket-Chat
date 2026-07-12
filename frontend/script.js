const socket=new WebSocket("ws://127.0.0.1:8000/ws")

const messageInput=document.getElementById("messageInput");
const usernameInput=document.getElementById("username")
const sendBtn=document.getElementById("sendBtn");
const messages=document.getElementById("messages");
const joinBtn=document.getElementById("joinBtn")
const onlineCount=document.getElementById("onlineCount");

let username="";

joinBtn.addEventListener('click',()=>{
    const name=usernameInput.value.trim();
    if(name==="")return;
    username = name;
    joinBtn.disabled = true;
    joinBtn.classList.add("joined");
    joinBtn.textContent="Joined✔️";
    usernameInput.disabled=true;
    const joined_data={
        type:"user_joined",
        username:username
    };
    // const onlineCount_data={
    //     type:"online_count",
    //     count:0
    // }
    socket.send(JSON.stringify(joined_data));
    // socket.send(JSON.stringify(onlineCount_data));
});

socket.onopen=()=>{
    console.log("Connected!");
};

sendBtn.addEventListener('click',()=>{
    if(username===""){
        alert("⚠️Please enter your username!");
        return;
    }
    if(messageInput.value.trim()=="")return;
    const data={
        type:"chat",
        message:messageInput.value
    };

    socket.send(JSON.stringify(data));
    messageInput.value="";
});

// document.addEventListener('keydown',(e)=>{
//     if(e.key=='Enter'){
//         if(input.value.trim()=="")return;
//         socket.send(input.value);
//         input.value="";
//     }
// });

socket.onmessage=(event)=>{
    const data=JSON.parse(event.data)
    switch(data.type){
        case "chat":{
            addMessage(data);
            break;
        }
        case "user_joined":{
            userJoinedMessage(data);
            break;
        }
        case "online_count":{
            updateOnlineCount(data);
            break;
        }
        case "user_left":{
            userLeftMessage(data);
            break;
        }
        default:
            console.warn("Unknown message type:", data.type);      
    }
};


function addMessage(data){
    const div=document.createElement("div");
    div.className="message";
    div.textContent=`${data.username}: ${data.message}`;
    if(username===data.username)div.classList.add("mine");
    
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}

function userJoinedMessage(data){
    const user_joined=document.createElement("div");
    const user_joined_container=document.createElement("div");
    user_joined.className="user-joined";
    user_joined_container.className="user-joined-container";
    user_joined.textContent=`${data.username} has joined`;
    user_joined_container.appendChild(user_joined);
    messages.appendChild(user_joined_container);
    messages.scrollTop = messages.scrollHeight;
}
function userLeftMessage(data){
    const user_left=document.createElement("div");
    const user_left_container=document.createElement("div");
    user_left.className="user-left";
    user_left_container.className="user-left-container";
    user_left.textContent=`${data.username} has left`;
    user_left_container.appendChild(user_left);
    messages.appendChild(user_left_container);
    messages.scrollTop = messages.scrollHeight;
}

function updateOnlineCount(data){
    onlineCount.textContent=`🟢 ${data.count} Online`;
}