const LoginForm=document.getElementById("LoginForm");
const usernameInput=document.getElementById("username");
const passwordInput=document.getElementById("password");
const message=document.getElementById("message");
const loginBtn=document.getElementById("loginBtn");
const togglePassword=document.getElementById("togglePassword");


LoginForm.addEventListener("submit",async(event)=>{
    // debugger;
    event.preventDefault();
    const username=usernameInput.value.trim();
    const password=passwordInput.value;
    message.textContent="";
    if(!username || !password){
        message.textContent="Please fill all details";
        return;
    }
    loginBtn.disabled=true;
    loginBtn.textContent="Signing In...";

    try{
        const response=await login(username,password);
        const data=await response.json();
        if(!response.ok){
            message.textContent=data.detail;
            return;
        }
        sessionStorage.setItem(TOKEN_KEY,data.access_token);
        console.log(sessionStorage);
        console.log(sessionStorage.getItem(TOKEN_KEY));
        message.textContent="Sign In Successfully! Redirecting...";
        setTimeout(()=>{
            window.location.href="chat.html";
        },1500);
    }
    catch(error){
        console.error(error)
        message.textContent="Something went wrong. Please try again.";
    }
    finally{
        loginBtn.disabled=false;
        loginBtn.textContent="Sign In";
        passwordInput.value="";
        passwordInput.focus();
    }
});


function setupPasswordToggle(button,input){
    const icon=button.querySelector("img");
    button.addEventListener("click",()=>{
        const isHidden=input.type==="password";
        input.type=isHidden?"text":"password";
        icon.src=isHidden?"assets/eyeopen.png":"assets/eyeclosed.png";
        icon.alt=isHidden?"Hide Password":"Show Password";
    });
}

setupPasswordToggle(togglePassword,passwordInput);