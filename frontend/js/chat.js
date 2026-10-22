
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

let availableUsers = [];
let filteredAvailableUsers = [];
let selectedMembersIds = new Set();

let isGroupInfoModelOpen=false;

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

const addMembersButton=document.getElementById("add-member-btn");
const addMembersOption=document.getElementById("add-member-option");
const addMembersModal=document.getElementById("add-members-modal");
const memberSearch=document.getElementById("member-search");
const availableUsersList=document.getElementById("available-users-list");
const cancelAddMembersButton = document.getElementById("cancel-add-members-btn");
const confirmAddMembersButton = document.getElementById("confirm-add-members-btn");

const groupInfoOption=document.getElementById("group-info-option")
const groupInfoModal = document.getElementById("group-info-modal");
const closeGroupInfoButton = document.getElementById("close-group-info-btn");
const groupInfoContent=document.getElementById("group-info-content");

const renameGroupOption=document.getElementById("rename-group-option");
const renameGroupModal=document.getElementById("rename-group-modal");
const cancelGroupRenameButton=document.getElementById("cancel-group-rename-btn");
const saveGroupRenameButton=document.getElementById("save-group-rename-btn");
const groupRenameInput=document.getElementById("group-rename-input");

const leaveGroupOption=document.getElementById("leave-group-option");
const backToConversationButton=document.getElementById("back-to-conversations");

const attachImageBtn = document.getElementById("attach-image-btn");
const imageInput = document.getElementById("image-input");

document.addEventListener("DOMContentLoaded", initialize);
logoutButton.addEventListener("click",logout);
sendMessageButton.addEventListener("click", sendMessage);
messageInput.addEventListener("input",handleTypingInput);
chatMenuButton.addEventListener("click", openChatMenuModal);

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
        closeChatMenuModal();
        // }
    }
    if (!event.target.closest(".message-menu-button") &&!event.target.closest(".message-options-menu")) 
    {
        closeMessageMenu();
    }
});

backToConversationButton.addEventListener("click", () => {
        document.body.classList.remove("mobile-chat-open");
    });
    
newConversationButton.addEventListener("click",openNewConversationModal);
cancelNewChatButton.addEventListener("click", closeNewConversationModal);
createConversationButton.addEventListener("click", createConversation);
groupNameInput.addEventListener("input",updateCreateButton);

addMembersButton.addEventListener("click", openAddMembersModal);
addMembersOption.addEventListener("click",openAddMembersModal);
cancelAddMembersButton.addEventListener("click", closeAddMembersModal);
confirmAddMembersButton.addEventListener("click",addNewMembers);

groupInfoOption.addEventListener("click", openGroupInfoModal);
closeGroupInfoButton.addEventListener("click", closeGroupInfoModal);

renameGroupOption.addEventListener("click",openRenameGroupModal);
cancelGroupRenameButton.addEventListener("click",closeRenameGroupModal);
saveGroupRenameButton.addEventListener("click",renameGroup);

leaveGroupOption.addEventListener('click',leaveGroup);

attachImageBtn.addEventListener("click", () => {
    if (!currentConversation) {
        alert("Open a conversation first.");
        return;
    }

    imageInput.click();
});
imageInput.addEventListener("change", uploadImage);

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
        case "members_added":
            handleMembersAdded(data);
            break;
        case "member_removed":
            handleMemberRemoved(data);
            break;
        case "member_left":
            handleMemberRemoved(data);
            break;
        case "group_name_changed":
            handleGroupNameChanged(data);
            break;
        case "made_admin":
            handleAdminUpdate(data);
            break;
        case "demoted_admin":
            handleAdminUpdate(data);
            break;
        case "message_deleted":
            handleMessageUpdates(data);
            break;
        case "message_edited":
            handleMessageUpdates(data);
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
        message_type: data.message_type || "user",
        is_edited: data.is_edited || false,
        created_at: data.created_at,
        read_by:data.read_by
    };
    updateConversationPreview(message);
    if (!currentConversation) return;
    if (data.conversation_id !== currentConversation.id)return;
    const pendingMessage=messages.find(m=>m.id===data.temp_id);
    if(pendingMessage){
        pendingMessage.id=data.message_id,
        pendingMessage.created_at = data.created_at;
        pendingMessage.message_type = data.message_type || "user";
        pendingMessage.is_edited = data.is_edited || false;
        pendingMessage.pending = false;
        pendingMessage.content = data.content;
        pendingMessage.read_by = data.read_by || [];
        updateConversationPreview({
            conversation_id: data.conversation_id,
            sender_id: data.sender_id,
            content: data.content,
            message_type: data.message_type || "user",
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
    // console.log("Read:", data);
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

function handleMembersAdded(data) {
    if (currentConversation && currentConversation.id === data.conversation.id)
        loadMessages(currentConversation.id);
    const message={
        "conversation_id":data.conversation.id,
        "content":data.conversation.last_message,
        "created_at":data.conversation.last_message_time,
    }
    updateConversationPreview(message);
}

async function handleMemberRemoved(data) {
    if(currentUser.id===data.member_id){
        // console.log("This user was removed. Reloading conversations...");
        await loadConversations();
        if(currentConversation && currentConversation.id===data.conversation.id){
            currentConversation = null;
            chatAvatar.textContent = "A";
            chatName.textContent = "Select a Conversation";
            chatStatus.textContent = "No conversation selected";
            addMembersButton.classList.add("hidden");
            chatMenuButton.classList.add("hidden");
            messagesContainer.innerHTML = `
                <div class="empty-chat" id="empty-chat">
                    <div class="empty-chat-icon">
                        💬
                    </div>
                    <h2>Select a Conversation</h2>
                    <p>
                        Choose a conversation from the sidebar
                        or create a new one.
                    </p>
                </div>
            `;
        }
    }
    if (currentConversation && currentConversation.id === data.conversation.id) {
        loadMessages(currentConversation.id);
    }
    const message={
        "conversation_id":data.conversation.id,
        "content":data.conversation.last_message,
        "created_at":data.conversation.last_message_time,
    }
    updateConversationPreview(message);
}

function handleGroupNameChanged(data){
    const existingConversation=conversations.find(
        c=>c.id===data.conversation.id
    );
    if(existingConversation){
        existingConversation.display_name=data.conversation.display_name;
        existingConversation.avatar=data.conversation.avatar;
    }
    if (
        currentConversation &&
        currentConversation.id === data.conversation.id
    ) {
        currentConversation=data.conversation;
        updateChatHeader(currentConversation);
        loadMessages(currentConversation.id);
    }
    const message={
        "conversation_id":data.conversation.id,
        "content":data.conversation.last_message,
        "created_at":data.conversation.last_message_time,
    }
    updateConversationPreview(message);
}

async function handleAdminUpdate(data){
    if (currentConversation && currentConversation.id === data.conversation.id) {
        loadMessages(currentConversation.id);
    }
    if(isGroupInfoModelOpen)await openGroupInfoModal();
    const message={
        "conversation_id":data.conversation.id,
        "content":data.conversation.last_message,
        "created_at":data.conversation.last_message_time,
    }
    updateConversationPreview(message);
}

async function handleMessageUpdates(data) {
    if (currentConversation && currentConversation.id === data.conversation.id) {
        loadMessages(currentConversation.id);
    }
    const message={
        "conversation_id":data.conversation.id,
        "content":data.conversation.last_message,
        "created_at":data.conversation.last_message_time,
    }
    updateConversationPreview(message);
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
    if(conversation.last_message){
        lastMessage.textContent=conversation.last_message_type==="image"?"📷 Image": conversation.last_message;
    }
    else lastMessage.textContent="No message yet";

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
    document.body.classList.add("mobile-chat-open");
    currentConversation=conversation;
    // console.log(currentConversation);
    conversation.unread_count = 0;
    if(currentConversation.type==="private")addMembersButton.classList.add("hidden");
    else addMembersButton.classList.remove("hidden");
    chatMenuButton.classList.remove("hidden");
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
    let previousDate=null;
    messages.forEach(message=>{
        const messageDate = new Date(message.created_at);
        const currentDate = new Date(messageDate);
        currentDate.setHours(0, 0, 0, 0);
        const dateKey = currentDate.getTime();
        if(dateKey!==previousDate){
            const separator = document.createElement("div");
            separator.className = "date-separator";
            const label = document.createElement("span");
            label.textContent = formatMessageDate(message.created_at);

            separator.appendChild(label);
            messagesContainer.appendChild(separator);
            previousDate=dateKey;
        }

        const element=createMessageElement(message);
        messagesContainer.appendChild(element);
    });
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    lucide.createIcons();
}

function createMessageElement(message){
    if (message.message_type === "system") {
        const row = document.createElement("div");
        row.className = "system-message-row";
        const icon = document.createElement("i");
        if(message.system_action==="member_removed")icon.setAttribute("data-lucide", "user-minus");
        else if(message.system_action==="member_added")icon.setAttribute("data-lucide", "user-plus");
        const content = document.createElement("span");
        content.textContent = message.content;
        row.appendChild(icon);
        row.appendChild(content);
        return row;
    }
    const row=document.createElement("div");
    const bubble=document.createElement("div");
    const isImage = message.message_type === "image";
    const content = document.createElement(isImage ? "img" : "p");
    const meta = document.createElement("div");
    const time=document.createElement("span");
    const status=document.createElement("span");
    row.className="message-row";
    bubble.className="message-bubble";
    if (isImage) {
        content.className = "message-image";
        content.src = message.content;
        content.alt = "Shared image";
        content.loading = "lazy";
        content.width = 320;
        content.height = 240;
        content.addEventListener("click", () => {
            window.open(
                content.src,
                "_blank",
                "noopener,noreferrer"
            );
        });
    } else {
        content.className = "message-content";
        content.textContent = message.content;
    }
    meta.className = "message-meta";
    time.className="message-time";
    status.className="message-status";
    time.textContent=formatMessageTime(message.created_at);
    meta.appendChild(time);
    if (message.is_edited) {
        const editedLabel = document.createElement("span");
        editedLabel.className = "edited-label";
        editedLabel.textContent = "edited";
        meta.appendChild(editedLabel);
    }
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

    const menuButton=document.createElement("button")
    menuButton.className = "message-menu-button";
    menuButton.type = "button";
    menuButton.setAttribute("aria-label", "Message options");
    const menuIcon=document.createElement("i");
    menuIcon.className = "message-menu-icon";
    menuIcon.setAttribute("data-lucide", "chevron-down");
    menuButton.appendChild(menuIcon);

    const menu = document.createElement("div");
    menu.className = "message-options-menu hidden";

    const deleteForMeButton = document.createElement("button");
    deleteForMeButton.className = "delete-message-button";
    deleteForMeButton.type = "button";
    deleteForMeButton.textContent = "Delete for me";

    const deleteForEveryoneButton = document.createElement("button");
    deleteForEveryoneButton.className = "delete-message-button";
    deleteForEveryoneButton.type = "button";
    deleteForEveryoneButton.textContent = "Delete for everyone";

    const editButton = document.createElement("button");
    editButton.className = "edit-message-button";
    editButton.textContent = "Edit";

    
    menuButton.addEventListener("click", function (event) {
        event.stopPropagation();

        if (menu.classList.contains("hidden")) {
            openMessageMenu(menu);
        } else {
            closeMessageMenu();
        }
    });

    editButton.addEventListener("click",() => {
        UpdateMessage(message);
    });
    deleteForMeButton.addEventListener("click",() => {
        deleteMessageForMyself(message.id);
    });
    deleteForEveryoneButton.addEventListener("click",() => {
        deleteMessageForAll(message.id);
    });
    if(message.sender_id!==currentUser.id){
        editButton.classList.add("hidden");
        deleteForEveryoneButton.classList.add("hidden");
    }
    menu.appendChild(editButton);
    menu.appendChild(deleteForMeButton);
    menu.appendChild(deleteForEveryoneButton);
    bubble.appendChild(menuButton);
    bubble.appendChild(menu);
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

function formatMessageDate(dateString){
    const messageDate=new Date(dateString);
    const today=new Date();
    const yesterday=new Date();
    today.setHours(0,0,0,0);
    yesterday.setDate(yesterday.getDate()-1);
    yesterday.setHours(0,0,0,0);
    const date=new Date(messageDate);
    date.setHours(0,0,0,0);
    if (date.getTime() === today.getTime()) {
        return "Today";
    }
    if (date.getTime() === yesterday.getTime()) {
        return "Yesterday";
    }
    return messageDate.toLocaleDateString(undefined, {
        day: "numeric",
        month: "long",
        year: "numeric"
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
    conversation.last_message = message.message_type === "image"? "📷 Image": message.content;
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
    selectedUserId = null;
    selectedUserIds.clear();
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

async function openAddMembersModal(){
    if(!currentConversation || currentConversation.type==="private")return;
    const response=await getAvailableUsers(token,currentConversation.id);
    if(!response.ok){
        alert("Failed to load users.");
        return;
    }
    
    availableUsers=await response.json();
    filteredAvailableUsers=[...availableUsers];
    selectedMembersIds.clear();
    memberSearch.value = "";
    renderAvailableUsers();
    updateAddMembersButton();
    addMembersModal.classList.remove("hidden");
}

function closeAddMembersModal(){
    addMembersModal.classList.add("hidden");
    availableUsers=[];
    selectedMembersIds.clear();
    memberSearch.value="";
    updateAddMembersButton();
}

function renderAvailableUsers(){
    availableUsersList.innerHTML="";
    filteredAvailableUsers.forEach(user=>{
        const div=document.createElement("div");
        div.className = "user-item";
        div.textContent = user.username;
        if (selectedMembersIds.has(user.id))div.classList.add("selected");
        div.addEventListener("click", () => {
            selectMember(user);
        });
        availableUsersList.appendChild(div);
    });
}

function selectMember(user) {
    if(selectedMembersIds.has(user.id))selectedMembersIds.delete(user.id);
    else selectedMembersIds.add(user.id);
    updateAddMembersButton();
    renderAvailableUsers();
}

function updateAddMembersButton(){
    confirmAddMembersButton.disabled=!(selectedMembersIds.size>0);
}

memberSearch.addEventListener("input", () => {
    const search = memberSearch.value
        .trim()
        .toLowerCase();
    filteredAvailableUsers = availableUsers.filter(user =>
        user.username.toLowerCase().includes(search)
    );
    renderAvailableUsers();
});

async function addNewMembers() {
    const response=await addMembers(token,currentConversation.id,[...selectedMembersIds]);
    const data=await response.json();
    if(!response.ok){
        alert(data.detail);
        return;
    }
    closeAddMembersModal();
}

async function openGroupInfoModal() {
    if (!currentConversation) return;
    if (currentConversation.type === "private") return;
    isGroupInfoModelOpen=true;
    const response=await getConversationMembers(token,currentConversation.id);
    if(!response.ok){
        alert("Failed to load group members.");
        return;
    }
    const members = await response.json();
    console.log(currentUser);
    console.log(members);
    groupInfoContent.innerHTML="";
    const header=document.createElement("div");
    header.classList.add("group-info-header");

    const groupDP=document.createElement("div");
    groupDP.classList.add("group-info-dp");
    groupDP.textContent=currentConversation.avatar;

    const groupName = document.createElement("h2");
    groupName.textContent = currentConversation.display_name;

    const memberCount = document.createElement("p");
    memberCount.textContent =
        `${members.length} ${members.length === 1 ? "member" : "members"}`;
    header.appendChild(groupDP);
    header.appendChild(groupName);
    header.appendChild(memberCount);
    groupInfoContent.appendChild(header);
    const membersSection = document.createElement("div");
    membersSection.classList.add("members-section");

    const membersTitle = document.createElement("h3");
    membersTitle.textContent = "Members";

    const membersList = document.createElement("div");
    membersList.classList.add("members-list");

    membersSection.appendChild(membersTitle);
    membersSection.appendChild(membersList);
    groupInfoContent.appendChild(membersSection);
    const currentMember = members.find(
        member => member.user_id === currentUser.id
    );
    members.forEach(member => {
        const memberItem = document.createElement("div");
        memberItem.classList.add("member-item");
        if(member.user_id===currentUser.id)memberItem.classList.add("current-user");
        const avatar = document.createElement("div");
        avatar.classList.add("member-avatar");
        avatar.textContent = member.username.charAt(0).toUpperCase();

        const details = document.createElement("div");
        details.classList.add("member-details");

        const username = document.createElement("strong");
        username.textContent = member.username;

        const role = document.createElement("span");
        role.textContent = member.role;

        details.appendChild(username);
        details.appendChild(role);

        const removeButton = document.createElement("button");

        removeButton.classList.add("remove-member-btn");
        const trashIcon = document.createElement("i");
        trashIcon.setAttribute("data-lucide", "trash-2");
        removeButton.appendChild(trashIcon);
        removeButton.title = "Remove member";

        removeButton.addEventListener("click", () => {
            removeMemberFromGroup(member);
        });


        const promoteButton = document.createElement("button");
        promoteButton.classList.add("promote-member-btn");
        const promoteIcon = document.createElement("i");
        promoteIcon.setAttribute("data-lucide", "arrow-up-circle");
        promoteButton.appendChild(promoteIcon);
        promoteButton.title = "Make admin";
        promoteButton.addEventListener("click", () => {
            makeAdmin(member);
        });
            
        
        const demoteButton = document.createElement("button");
        demoteButton.classList.add("demote-member-btn");

        const demoteIcon = document.createElement("i");
        demoteIcon.setAttribute("data-lucide", "arrow-down-circle");

        demoteButton.appendChild(demoteIcon);
        demoteButton.title = "Demote admin";

        demoteButton.addEventListener("click", () => {
            demoteAdmin(member);
        });
        
        // console.log(currentUser);
        if(currentMember.role==="member" || currentMember.user_id===member.user_id){
            promoteButton.classList.add("hidden");
            demoteButton.classList.add("hidden");
            removeButton.classList.add("hidden");
        }
        else if( member.role==="member")demoteButton.classList.add("hidden");
        else promoteButton.classList.add("hidden");
        memberItem.appendChild(avatar);
        memberItem.appendChild(details);
        memberItem.appendChild(promoteButton);
        memberItem.appendChild(demoteButton);
        memberItem.appendChild(removeButton);

        membersList.appendChild(memberItem);
        lucide.createIcons();
    });
    

    // console.log(members);

    groupInfoModal.classList.remove("hidden");
    chatMenu.classList.add("hidden");
}

function closeGroupInfoModal() {
    groupInfoModal.classList.add("hidden");
    groupInfoContent.innerHTML="";
    isGroupInfoModelOpen=false;
}

async function removeMemberFromGroup(member) {
    const confirmation=confirm(`
        Remove ${member.username} from the group?`);
    if(!confirmation)return;
    const response= await removeConversationMember(token,currentConversation.id,member.user_id);
    if(!response.ok){
        const error = await response.json();
        alert(error.detail || "Failed to remove member.");
        openGroupInfoModal();
        return;
    }
    closeGroupInfoModal();
}

function openRenameGroupModal(){
    if (!currentConversation || currentConversation.type === "private") return;
    groupRenameInput.value = currentConversation.display_name || "";
    // console.log(g)
    renameGroupModal.classList.remove("hidden");
    chatMenu.classList.add("hidden");
    groupRenameInput.focus();
}

function closeRenameGroupModal(){
    renameGroupModal.classList.add("hidden");
}

async function renameGroup(){
    if (!currentConversation || currentConversation.type === "private") return;
    const newName = groupRenameInput.value.trim();
    if (!newName) {
        alert("Group name cannot be empty.");
        return;
    }
    if(newName===currentConversation.display_name){
        alert(`New name cannot be same.`);
        return;
    }
    const response=await updateGroupName(token,currentConversation.id,newName);
    if(!response.ok){
        const error = await response.json();
        alert(error.detail || "Failed to update group name.");
        openRenameGroupModal();
        return;
    }
    closeRenameGroupModal();
}

async function leaveGroup() {
    if(!currentConversation || currentConversation.type=="private")return;
    const confirmation=confirm(`
        Do you want to leave group?`);
    if(!confirmation)return;
    const response= await leaveTheGroup(token,currentConversation.id);
    if(!response.ok){
        const error = await response.json();
        alert(error.detail || "Failed to leave.");
        openGroupInfoModal();
        return;
    }
    closeChatMenuModal();
}

function openChatMenuModal(){
    chatMenu.classList.toggle("hidden");
    if (currentConversation) {
        console.log("Current conversation:", currentConversation);
        console.log("Conversation type:", currentConversation.type);
        const isPrivate = currentConversation.type === "private";
        groupInfoOption.classList.toggle("hidden", isPrivate);
        renameGroupOption.classList.toggle("hidden", isPrivate);
        addMembersOption.classList.toggle("hidden", isPrivate);
        leaveGroupOption.classList.toggle("hidden", isPrivate);
    }
}

function closeChatMenuModal(){
    chatMenu.classList.add("hidden");
        // if(currentConversation && currentConversation.type=="private"){
    groupInfoOption.classList.remove("hidden");
    renameGroupOption.classList.remove("hidden");
    addMembersOption.classList.remove("hidden");
    leaveGroupOption.classList.remove("hidden");
}

async function makeAdmin(member){
    const confirmation=confirm(`Do you want to promote ${member.username} to admin.`);
    if(!confirmation)return;
    try{

        const response= await callMakeAdmin(token,currentConversation.id,member.user_id);
        if(!response.ok){
            const error = await response.json();
            alert(error.detail || "Failed to promote member.");
            openGroupInfoModal();
            return;
        }
    }
    catch(error){
        console.error("Error promoting member:", error);
        alert("Something went wrong while promoting the member.");
    }
}

async function demoteAdmin(member){
    const confirmation=confirm(`Do you want to demote ${member.username} from admin.`);
    if(!confirmation)return;
    try{

        const response= await callDemoteAdmin(token,currentConversation.id,member.user_id);
        if(!response.ok){
            const error = await response.json();
            alert(error.detail || "Failed to demote member.");
            openGroupInfoModal();
            return;
        }
    }
    catch(error){
        console.error("Error demoting member:", error);
        alert("Something went wrong while demoting the member.");
    }
}

function closeMessageMenu() {
    document.querySelectorAll(".message-options-menu").forEach(menu => {
        menu.classList.add("hidden");
    });
}

function openMessageMenu(menu) {
    closeMessageMenu();
    menu.classList.remove("hidden");
}

async function deleteMessageForMyself(message_id) {
    const confirmation=confirm(`Do you want to delete this message?`);
    if(!confirmation)return;
    try{
        const response= await deleteMessageForMe(token,currentConversation.id,message_id);
        if(!response.ok){
            const error = await response.json();
            alert(error.detail || "Failed to delete message.");
            return;
        }
        closeMessageMenu();
    }
    catch(error){
        console.error("Error deleting the message:", error);
        alert("Something went wrong while deleting the message.");
    }
}

async function deleteMessageForAll(message_id) {
    const confirmation=confirm(`Do you want to delete this message?`);
    if(!confirmation)return;
    try{
        const response= await deleteMessageForEveryone(token,currentConversation.id,message_id);
        if(!response.ok){
            const error = await response.json();
            alert(error.detail || "Failed to delete message.");
            return;
        }
        closeMessageMenu();
    }
    catch(error){
        console.error("Error deleting the message:", error);
        alert("Something went wrong while deleting the message.");
    }
}

async function UpdateMessage(message){
    const newContent=prompt("Edit your message:",message.content);
    if (newContent === null) return;
    const content=newContent.trim();
    if (!content) {
        alert("Message cannot be empty.");
        return;
    }
    if (content === message.content) return;
    try {
        const response = await editMessageRequest(
            token,
            currentConversation.id,
            message.id,
            content
        );

        if (!response.ok) {
            const error = await response.json();
            alert(error.detail || "Failed to edit message.");
            return;
        }
        const updatedMessage = await response.json();
        const messageElement = document.querySelector(
            `[data-message-id="${message.id}"]`
        );

        if (messageElement) {
            const contentElement =
                messageElement.querySelector(".message-content");

            if (contentElement) {
                contentElement.textContent = updatedMessage.content;
            }
        }

        closeMessageMenu();
    }
    catch(error){
        console.error("Error editing message:", error);
        alert("Something went wrong while editing the message.");
    }
}

async function uploadImage(){
    const file=imageInput.files[0];
    imageInput.value="";
    if (!file || !currentConversation) return;
    const allowedTypes = ["image/jpeg","image/png","image/webp"];
    if (!allowedTypes.includes(file.type)) {
        alert("Only JPEG, PNG, and WebP images are allowed.");
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        alert("Image size must not exceed 5 MB.");
        return;
    }
    attachImageBtn.disabled = true;
    try{
        const response=await uploadImageRequest(token,currentConversation.id,file);
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.detail || "Image upload failed.");
        }
        const message = await response.json();

        updateConversationPreview(message);
        if (currentConversation?.id === message.conversation_id) {
            const alreadyExists = messages.some(m => m.id === message.id);
            if (!alreadyExists) {
                messages.push(message);
                renderMessages();
            }
        }
    }
    catch (error) {
        console.error("Image upload error:", error);
        alert(error.message || "Could not upload image.");
    } 
    finally {
        attachImageBtn.disabled = false;
    }
}