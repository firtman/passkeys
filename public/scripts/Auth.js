import API from "./API.js";
import Router from "./Router.js";

const Auth = {
    isLoggedIn: false,
    account: null,
    updateStatus() {
        if (Auth.isLoggedIn && Auth.account) {
            document.querySelectorAll(".logged_out").forEach(
                e => e.style.display = "none"
            );
            document.querySelectorAll(".logged_in").forEach(
                e => e.style.display = "block"
            );
            document.querySelectorAll(".account_name").forEach(
                e => e.innerHTML = Auth.account.name
            );
            document.querySelectorAll(".account_username").forEach(
                e => e.innerHTML = Auth.account.email
            );

        } else {
            document.querySelectorAll(".logged_out").forEach(
                e => e.style.display = "block"
            );
            document.querySelectorAll(".logged_in").forEach(
                e => e.style.display = "none"
            );

        }
    },

    // TODO: Step 1

    // TODO: Step 2

    // TODO: Step 4

    
    // TODO: Step 5
    init: () => {
        // TODO: Step 5

        // TODO: Step 12 C
    },
   
    // TODO: Step 6

    // TODO: Step 10

    // TODO: Step 11

    // TODO: Step 12 B

}
Auth.updateStatus();
// Auth.autoLogin();

export default Auth;

// make it a global object
window.Auth = Auth;

