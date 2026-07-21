const registerForm=document.getElementById("registerForm");
const usernameInput=document.getElementById("username");
const passwordInput=document.getElementById("password");
const confirmPasswordInput=document.getElementById("confirmPassword");
const message=document.getElementById("message");
const registerBtn=document.getElementById("registerBtn");
const togglePassword=document.getElementById("togglePassword");
const toggleConfirmPassword=document.getElementById("toggleConfirmPassword");
registerForm.addEventListener("submit",async(event)=>{
    event.preventDefault();
    const username=usernameInput.value.trim();
    const password=passwordInput.value;
    const confirmPassword=confirmPasswordInput.value;
    message.textContent="";
    if(!username || !password || !confirmPassword){
        message.textContent="Please fill all details!";
        return;
    }
    if(password !==confirmPassword){
        message.textContent="Passwords do not Match";
        return;
    }
    registerBtn.disabled=true;
    registerBtn.textContent="Creating Account...";

    try{
        const response=await register(username,password);
        const data=await response.json()

        if(!response.ok){
            message.textContent=data.detail;
            return;
        }
        
        
        window.location.href="login.html";
        
              
    }
    catch(error){
        console.error(error);
        message.textContent="Something went wrong. Please try again.";
    }
    finally{
        registerBtn.disabled=false;
        registerBtn.textContent="Create Account";
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
setupPasswordToggle(toggleConfirmPassword,confirmPasswordInput);