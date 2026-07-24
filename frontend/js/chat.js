let token = null;
let currentUser = null;
let conversations = [];
let currentConversation = null;
let messages=[];
let websocket = null;
let isTyping = false;
let typingTimeout = null;

let users = [];
let filteredUsers = [];
let selectedUserId = null;
let selectedUserIds = new Set();

const conversationList=document.getElementById("conversation-list");
const messagesContainer=document.getElementById("messages-container");
const messageInput=document.getElementById("message-input");
const sendMessageButton=document.getElementById("send-message-btn");
const logoutButton=document.getElementById("logout-btn");
const searchInput=document.getElementById("conversation-search");
const userAvatar=document.getElementById("user-avatar");
const username=document.getElementById("username");
const chatAvatar=document.getElementById("chat-avatar");
const chatName=document.getElementById("chat-name");
const chatStatus=document.getElementById("chat-status");
const emptyChat=document.getElementById("empty-chat");
const chatMenuButton=document.getElementById("chat-menu-btn");
const chatMenu=document.getElementById("chat-menu");
const deleteConversationButton=document.getElementById("delete-conversation-option");

const newConversationButton=document.getElementById("new-conversation-btn");
const newConversationModal=document.getElementById("new-conversation-modal");
const cancelNewChatButton = document.getElementById("cancel-new-chat-btn");
const userSearch = document.getElementById("user-search");
const usersList = document.getElementById("users-list");
const conversationType = document.getElementsByName("conversation-type");
const groupNameContainer = document.getElementById("group-name-container");
const groupNameInput = document.getElementById("group-name");
const createConversationButton = document.getElementById("create-conversation-btn");


document.addEventListener("DOMContentLoaded", initialize);
logoutButton.addEventListener("click",logout);
sendMessageButton.addEventListener("click", sendMessage);
messageInput.addEventListener("input",handleTypingInput);
chatMenuButton.addEventListener("click", () => {
    chatMenu.classList.toggle("hidden");
});

document.addEventListener("visibilitychange", () => {
    if (
        document.visibilityState === "visible" &&
        currentConversation
    ) {
        websocket.send(JSON.stringify({
            type: "mark_read",
            conversation_id: currentConversation.id
        }));
    }
});
document.addEventListener("click", (event) => {
    if (!chatMenu.contains(event.target) &&!chatMenuButton.contains(event.target)) 
    {
        chatMenu.classList.add("hidden");
    }
});

newConversationButton.addEventListener("click",openNewConversationModal);
cancelNewChatButton.addEventListener("click", closeNewConversationModal);
createConversationButton.addEventListener("click", createConversation);
groupNameInput.addEventListener("input",updateCreateButton);

function connectWebSocket() {
    websocket = new WebSocket(
        `${WS_BASE}/ws?token=${token}`
    );
    websocket.onopen = () => {
        console.log("✅ WebSocket Connected");
    };
    websocket.onclose = () => {
        console.log("❌ WebSocket Closed");
    };
    websocket.onerror = (error) => {
        console.error("WebSocket Error:", error);
    };
    websocket.onmessage = handleSocketMessage;
}

function handleSocketMessage(event) {

    const data = JSON.parse(event.data);

    switch (data.type) {
        case "new_message":
            handleNewMessage(data);
            break;
        case "typing":
            handleTyping(data);
            break;
        case "stop_typing":
            handleStopTyping(data);
            break;
        case "messages_read":
            handleMarkRead(data);
            break;
        case "conversation_deleted":
            handleConversationDeleted(data);
            break;
        case "conversation_created":
            handleConversationCreated(data);
            break;
        case "error":
            alert(data.message);
            break;
        default:
            console.log("Unknown event:", data);
    }

}

function handleNewMessage(data) {
    const message = {
        id: data.message_id,
        conversation_id: data.conversation_id,
        sender_id: data.sender_id,
        content: data.content,
        created_at: data.created_at,
        read_by:data.read_by
    };
    updateConversationPreview(message);
    if (!currentConversation) return;
    if (data.conversation_id !== currentConversation.id)
        return;
    const pendingMessage=messages.find(m=>m.id===data.temp_id);
    if(pendingMessage){
        pendingMessage.id=data.message_id,
        pendingMessage.created_at = data.created_at;
        pendingMessage.pending = false;
        updateConversationPreview({
            conversation_id: data.conversation_id,
            sender_id: data.sender_id,
            content: data.content,
            created_at: data.created_at,
            read_by:data.read_by
        });
    }
    else messages.push(message);
    renderMessages();
    if (
        document.visibilityState==="visible" &&
        currentConversation &&
        currentConversation.id === data.conversation_id &&
        data.sender_id !== currentUser.id
    ) {
        websocket.send(JSON.stringify({
            type: "mark_read",
            conversation_id: currentConversation.id
        }));
    }
}

function handleTyping(data) {
    console.log("Typing:", data);
    if (!currentConversation) return;
    if (data.conversation_id !== currentConversation.id)
        return;
    if(currentConversation.type=="group"){
        chatStatus.textContent = `${data.display_name} typing...`;
    }
    else chatStatus.textContent = "Typing...";
}

function handleStopTyping(data) {
    // console.log("Stop Typing:", data);
    if (!currentConversation) return;
    if (data.conversation_id !== currentConversation.id)return;
    if (currentConversation.type === "group") {
        chatStatus.textContent = "Group";
    } 
    else {
        chatStatus.textContent = "";
    }
}

function handleMarkRead(data) {
    console.log("Read:", data);
    data.message_ids.forEach(messageId => {
        const message = messages.find(m => m.id === messageId);
        if (!message) return;
        message.read_by.push({
            user_id: data.user_id,
            read_at: data.read_at
        });
    });
    
    renderMessages();
}

function handleConversationDeleted(data) {

    conversations = conversations.filter(
        c => c.id !== data.conversation_id
    );

    if (
        currentConversation &&
        currentConversation.id === data.conversation_id
    ) {
        currentConversation = null;
        messages = [];
    }

    renderConversationList();
    renderMessages();
}

function handleConversationCreated(data){
    if (conversations.some(c => c.id === data.conversation.id))return;
    conversations.push(data.conversation);
    conversations.sort((a, b) => {
        const t1 = new Date(a.last_message_time || a.created_at)
        const t2 =new Date(b.last_message_time || b.created_at)
        return t2 - t1;
    });
    renderConversationList();

}

async function initialize() {
    // debugger;
    token=sessionStorage.getItem(TOKEN_KEY);
    // console.log("Token:", token);
    if(!token){
        // console.log("No token found");
        window.location.href = "login.html";
        return;
    }
    const response=await getCurrentUser(token);
    // console.log("GET /auth/me status:", response.status);
    if(!response.ok){
        // console.log(await response.text());
        sessionStorage.removeItem(TOKEN_KEY);

        window.location.href="login.html";
        return;
    }
    currentUser=await response.json();
    username.textContent=currentUser.username;
    userAvatar.textContent=currentUser.username[0].toUpperCase();
    // console.log(currentUser);
    const conversationResponse=await getUserConversations(token);
    if(!conversationResponse.ok){
        alert("Failed to load conversations.")
        return;
    }
    conversations=await conversationResponse.json();
    // console.log(conversations);
    renderConversationList();
    connectWebSocket();
}

function logout(){
    sessionStorage.removeItem(TOKEN_KEY);
    setTimeout(()=>{
        window.location.href="login.html";
    },1500);
}
async function loadConversations(){
    const conversationResponse=await getUserConversations(token);
    if(!conversationResponse.ok){
        alert("Failed to load conversations.")
        return;
    }
    conversations=await conversationResponse.json();
    renderConversationList();
}

function renderConversationList(){
    conversationList.innerHTML="";
    conversations.forEach(conversation=>{
        const element=createConversationElement(conversation);
        conversationList.append(element);
    });
}

function createConversationElement(conversation){
    const item=document.createElement("div");
    const avatar=document.createElement("div");
    const info=document.createElement("div");
    const top=document.createElement("div");
    const bottom=document.createElement("div");
    const name=document.createElement("h3");
    const time=document.createElement("span");
    const lastMessage=document.createElement("p");
    const unreadBadge = document.createElement("span");
    item.className="conversation-item";
    avatar.className="conversation-avatar";
    info.className="conversation-info";
    top.className="conversation-top";
    bottom.className="conversation-bottom";
    name.className="conversation-name";
    time.className="conversation-time";
    lastMessage.className="last-message";
    unreadBadge.className = "unread-badge";
    item.dataset.conversationId=conversation.id;
    item.dataset.type=conversation.type;
    avatar.textContent=conversation.avatar;
    name.textContent=conversation.display_name;
    time.textContent=conversation.last_message_time?formatConversationTime(conversation.last_message_time):"...";
    lastMessage.textContent=conversation.last_message??"No message yet";

    bottom.appendChild(lastMessage);
    top.appendChild(name);
    top.appendChild(time);
    info.append(top);
    info.append(bottom);
    item.appendChild(avatar);
    item.appendChild(info);
    if (conversation.unread_count > 0) {
        unreadBadge.textContent = conversation.unread_count;
        bottom.appendChild(unreadBadge);
    }
    item.addEventListener('click',()=>{
        openConversation(conversation);
    });
    return item;
}

async function openConversation(conversation){
    currentConversation=conversation;
    conversation.unread_count = 0;
    renderConversationList();
    setActiveConversation(conversation.id);
    updateChatHeader(conversation);
    showChatScreen();
    await loadMessages(conversation.id);
    // console.log(conversation);
    websocket.send(JSON.stringify({
        type: "mark_read",
        conversation_id: conversation.id
    }));
}

function setActiveConversation(conversationId){
    document
        .querySelectorAll('.conversation-item')
        .forEach(item=>item.classList.remove("active"));
    document.querySelector(
            `[data-conversation-id="${conversationId}"]`
    )?.classList.add("active");
}

function updateChatHeader(conversation){
    chatAvatar.textContent=conversation.avatar;
    chatName.textContent=conversation.display_name;
    if(conversation.type=="group"){
        chatStatus.textContent="Group";
    }
    else{
        chatStatus.textContent="";
    }
}

async function loadMessages(conversationId) {
    const response= await getConversationMessages(token,conversationId);
    if(!response.ok){
        alert("Failed to load messages.");
        return;
    }
    messages=await response.json();
    renderMessages();
}

function renderMessages(){
    messagesContainer.innerHTML="";
    messages.forEach(message=>{
        const element=createMessageElement(message);
        messagesContainer.appendChild(element);
    });
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    lucide.createIcons();
}

function createMessageElement(message){
    const row=document.createElement("div");
    const bubble=document.createElement("div");
    const content=document.createElement("p");
    const meta = document.createElement("div");
    const time=document.createElement("span");
    const status=document.createElement("span");
    row.className="message-row";
    bubble.className="message-bubble";
    content.className="message-content";
    meta.className = "message-meta";
    time.className="message-time";
    status.className="message-status";
    content.textContent=message.content;
    time.textContent=formatMessageTime(message.created_at);
    meta.appendChild(time);
    if(message.sender_id==currentUser.id){
        row.classList.add("outgoing");
        if (message.pending) {
            status.innerHTML = `
                <i data-lucide="clock-3"></i>
            `;
        }
        else if (message.read_by.length > 0) {
            status.innerHTML = `
                <i data-lucide="check"></i>
                <i data-lucide="check"></i>
            `;
        }
        else {
            status.innerHTML = `
                <i data-lucide="check"></i>
            `;
        }
        meta.appendChild(status);
    }
    else{
        row.classList.add("incoming");
    }
    bubble.appendChild(content);
    bubble.appendChild(meta);
    row.appendChild(bubble);
    return row;
}

function showChatScreen(){
    emptyChat.classList.add("hidden");
}

function formatConversationTime(timestamp) {

    if (!timestamp) {
        return "";
    }

    const date = new Date(timestamp);
    const now = new Date();

    const isToday =
        date.toDateString() === now.toDateString();

    if (isToday) {
        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    if (date.toDateString() === yesterday.toDateString()) {
        return "Yesterday";
    }

    return date.toLocaleDateString([], {
        day: "numeric",
        month: "short",
    });
}

function formatMessageTime(timestamp) {

    if (!timestamp) return "";

    return new Date(timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });
}

function sendMessage() {
    const content = messageInput.value.trim();
    if (!content || !currentConversation) return;

    const tempId=crypto.randomUUID();
    const tempMessage = {
        id: tempId,
        conversation_id: currentConversation.id,
        sender_id: currentUser.id,
        content: content,
        created_at: new Date().toISOString(),
        read_by:[],
        pending: true
    };
    messageInput.value = "";
    messages.push(tempMessage);
    renderMessages();
    websocket.send(JSON.stringify({
        type: "send_message",
        temp_id:tempId,
        conversation_id: currentConversation.id,
        content:content
    })); 
    if (isTyping) {
        isTyping = false;
        clearTimeout(typingTimeout);
        websocket.send(JSON.stringify({
            type: "stop_typing",
            conversation_id: currentConversation.id
        }));
    }
}

messageInput.addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
});

function updateConversationPreview(message){
    const conversation = conversations.find(
        c => c.id === message.conversation_id
    );
    if (!conversation) return;
    conversation.last_message = message.content;
    conversation.last_message_time = message.created_at;
    if (!currentConversation ||currentConversation.id !== message.conversation_id) {
        conversation.unread_count++;
    }
    const index = conversations.findIndex(
        c => c.id === message.conversation_id
    );
     if (index > 0) {
        const [conv] = conversations.splice(index, 1);
        conversations.unshift(conv);
    }
    renderConversationList();
    if (currentConversation) {
        setActiveConversation(currentConversation.id);
    }
}

function handleTypingInput() {
    if (!currentConversation || !websocket)return;
    if (!isTyping) {
        isTyping = true;
        websocket.send(JSON.stringify({
            type: "typing",
            conversation_id: currentConversation.id
        }));
    }
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        isTyping = false;
        websocket.send(JSON.stringify({
            type: "stop_typing",
            conversation_id: currentConversation.id
        }));
    }, 2000);
}

deleteConversationButton.addEventListener("click",async ()=>{
    if(!currentConversation)return;
    if(!confirm("Are you sure you want to delete this conversation?"))return;
    const response=await deleteConversation(token,currentConversation.id);
    if(!response.ok){
        const error = await response.json();
        alert(error.detail);
        return;
    }
    if(currentConversation){
        conversations = conversations.filter(c => c.id !== currentConversation.id);
    }
    currentConversation = null;
    messages = [];
    renderConversationList();
    renderMessages();
    chatMenu.classList.add("hidden");
});

async function openNewConversationModal() {
    newConversationModal.classList.remove("hidden");
    const response = await getUsers(token);
    if (!response.ok) {
        alert("Failed to load users.");
        return;
    }
    users = await response.json();
    filteredUsers = [...users];
    renderUsers();
}

function closeNewConversationModal() {
    newConversationModal.classList.add("hidden");
    selectedUser = null;
    selectedUsers = [];
    groupNameInput.value = "";
    userSearch.value = "";
    document.querySelector('input[value="private"]').checked = true;
    createConversationButton.disabled = true;
}

function renderUsers(){
    usersList.innerHTML="";
    filteredUsers.forEach(user=>{
        const div=document.createElement("div");
        div.className = "user-item";
        div.textContent = user.username;
        if (getConversationType() === "private") {
            if (selectedUserId && selectedUserId === user.id) div.classList.add("selected");
        } 
        else {
            if (selectedUserIds.has(user.id))div.classList.add("selected");
        }
        div.addEventListener("click", () => {
            selectUser(user);
        });
        usersList.appendChild(div);
    });
}

function getConversationType() {
    return document.querySelector(
        'input[name="conversation-type"]:checked'
    ).value;
}

function selectUser(user) {
    if (getConversationType() === "private") {
        if(selectedUserId===user.id)selectedUserId = null;
        else selectedUserId = user.id;
    } 
    else {
        if(selectedUserIds.has(user.id))selectedUserIds.delete(user.id);
        else selectedUserIds.add(user.id);
    
    }
    updateCreateButton();
    renderUsers();
}

function updateCreateButton() {

    if (getConversationType() === "private") {
        createConversationButton.disabled = selectedUserId === null;
    } 
    else {
        const validName =groupNameInput.value.trim().length > 0;
        const enoughMembers=selectedUserIds.size > 0;
        createConversationButton.disabled =!(validName && enoughMembers);
    }
}

conversationType.forEach(radio => {
    radio.addEventListener("change", () => {
        selectedUserId = null;
        selectedUsersIds = new Set();
        groupNameInput.value = "";
        groupNameContainer.classList.toggle(
            "hidden",
            getConversationType() === "private"
        );
        updateCreateButton();
        renderUsers();
    });
});

userSearch.addEventListener("input", () => {
    const search = userSearch.value
        .trim()
        .toLowerCase();
    filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(search)
    );
    renderUsers();
});

async function createConversation() {
    let response;
    try {
        if (getConversationType() === "private") {
            response = await createPrivateConversation(token,selectedUserId);
        } 
        else {
            response = await createGroupConversation(token,groupNameInput.value.trim(),[...selectedUserIds]);
        }
        if (!response.ok) {
            alert(data.detail);
            return;
        }
        const data = await response.json();
        handleConversationCreated({conversation: data});
        const conversation = conversations.find(c => c.id === data.id);
        if (conversation) {
            openConversation(conversation);
        }
        closeNewConversationModal();

    } 
    catch (error) {
        console.error(error);
        alert("Failed to create conversation.");
    }
}