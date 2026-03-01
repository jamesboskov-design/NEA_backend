const currentMonth = (new Date()).getMonth()
const currentDay = 5//(new Date()).getDate()
const days = document.getElementsByClassName("days")[0]
const monthName = document.getElementById("monthName")
const notLoggedInMessage = document.getElementById("notLoggedInMessage")


const extraDays = {
    0: 3,
    1: 0,
    2: 3,
    3: 2,
    4: 3,
    5: 2,
    6: 3,
    7: 3,
    8: 2,
    9: 3,
    10: 2,
    11: 3,
}

const montNames = {
    0: "January",
    1: "February",
    2: "March",
    3: "April",
    4: "May",
    5: "June",
    6: "July",
    7: "August",
    8: "september",
    9: "October",
    10: "November",
    11: "December",
}

async function getUserLoggedInStatus() {
    const response = await fetch("/isUserLoggedIn");
    const result = await response.json();
    return result
}

async function init() {
    userLoggedInStatus = (await getUserLoggedInStatus()).loggedIn

    if(!userLoggedInStatus) {
        notLoggedInMessage.innerText = "Please log in to use the daily reward feature"
    } else {
    monthName.innerText = montNames[currentMonth]

    extraDaysToday = extraDays[currentMonth]

    for(let i=1; i<22; i++) {
        let newDay = document.createElement('li');
        newDay.innerText = (i).toString()
        newDay.id = "day" + (i).toString()

        days.appendChild(newDay)
    }

    for(let i=1; i<8; i++) {
        let newDay = document.createElement('li');
        newDay.innerText = (21+i).toString()
        newDay.id = "day" + (21+i).toString()

        if(i>extraDaysToday) {
            newDay.classList.add("doubleBottomBorder")
        }
        days.appendChild(newDay)
    }

    for(let i=1; i<extraDaysToday+1; i++) {
        let newDay = document.createElement('li');
        newDay.innerText = (28+i).toString()
        newDay.id = "day" + (28+i).toString()

        if(i==extraDaysToday) {
            newDay.classList.add("doubleRightBorder")
        }
        days.appendChild(newDay)
    }

    let claimButton = document.createElement('button');
    claimButton.classList.add("btn")

    let lineBreak = document.createElement("br")

    claimButton.innerText = "Claim daily reward"

    const today = document.getElementById("day" + (currentDay.toString()))
    today.appendChild(lineBreak)
    today.appendChild(claimButton)

    claimButton.addEventListener("click", e => {
        localStorage.setItem("dailyRewardBonus", 10);
        
        fetch("/claimReward", {
            method : "POST",
            body : JSON.stringify({
                monthClaimed: currentMonth,
                dayClaimed: currentDay
            }),
            headers : {
                "Content-type": "application/json; charset=UTF-8"
            }
        });
    })
    }
}

init()