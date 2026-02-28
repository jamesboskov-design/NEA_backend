const modal = document.getElementById("modal");
const modalNoLogin = document.getElementById("modalNoLogin");
const button = document.getElementById("analysisButton");
const cross = document.getElementById("closeButton")
const crossNoLogin = document.getElementById("closeButtonNoLogin")
const meanSentence = document.getElementById("meanSentence")
const standardDeviationSentence = document.getElementById("standardDeviationSentence")
const byDayChart = document.getElementById("byDayChart")

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

let scores = []
let timesElapsed = []
let dates = []
let daysOfTheWeek = [] // 0 = sunday, 1 = monday and so on
let quizDataLength = 0
let mean = 0
let standardDeviation = 0

async function getUserLoggedInStatus() {
    const response = await fetch("/isUserLoggedIn");
    const result = await response.json();
    return result
}

async function getQuizData() {
    const response = await fetch("/getQuizData")
    const result = await response.json()
    return result
}

async function init() {
    userLoggedInStatus = (await getUserLoggedInStatus()).loggedIn
    
    button.onclick = () => {
        if(userLoggedInStatus) {
            modal.style.display = "block";

        } else {
            modalNoLogin.style.display = "block";
        }
    }

    cross.onclick = () =>  {
        modal.style.display = "none";
    }
    crossNoLogin.onclick = () =>  {
        modalNoLogin.style.display = "none";
    }

    if (userLoggedInStatus) {
        quizData = Array.from(await getQuizData())
        console.log(quizData)
        quizData.forEach(quiz => {
            scores.push(quiz["score"])
            timesElapsed.push(quiz["timeTaken"])
            let dateCompleted = new Date(quiz["dateCompleted"])
            dates.push(dateCompleted)
            daysOfTheWeek.push(dateCompleted.getDay())
        });
        quizDataLength = quizData.length
        
        // mean and sd
        meanAndSD = calculateMeanAndStandardDeviation(scores, quizDataLength)
        mean = meanAndSD[0]
        standardDeviation = meanAndSD[1]

        meanSentence.innerText = "On average you score " + mean + " points"
        standardDeviationSentence.innerText = "With a standard deviation of " + standardDeviation + " points"

        // day of the week bar chart
        renderScoreByDayBarChart(scores, daysOfTheWeek)
        
    }
}

calculateMeanAndStandardDeviation = (events, eventsLength) => {
    total = 0
    squaredTotal = 0
    events.forEach(occurence => {
        total += occurence
        squaredTotal += Math.pow(occurence, 2)
    })
    mean = total/eventsLength
    variance = (squaredTotal/eventsLength)-Math.pow(mean, 2)
    standardDeviation = Math.pow(variance, 0.5)
    return [mean, standardDeviation]
}

renderScoreByDayBarChart = (scores, daysCompleted) => {
    let scoreByDay = [0, 0, 0, 0, 0, 0, 0]
    for(let i = 0; i<scores.length; i++){
        console.log(daysCompleted[i], scores[i])
        scoreByDay[daysCompleted[i]] += scores[i]
    }

}

init()