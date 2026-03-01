const modal = document.getElementById("modal");
const modalNoLogin = document.getElementById("modalNoLogin");
const button = document.getElementById("analysisButton");
const cross = document.getElementById("closeButton")
const crossNoLogin = document.getElementById("closeButtonNoLogin")
const meanSentence = document.getElementById("meanSentence")
const standardDeviationSentence = document.getElementById("standardDeviationSentence")
const byDayChart = document.getElementById("byDayChart")
const scoresByDayChart = document.getElementById("scoresByDayChart");
const normalChart = document.getElementById("normalChart");
const lastFiveText = document.getElementById("lastFiveText");
const linearChart = document.getElementById("linearChart"); 
console.log(linearChart)

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
        renderNormalDistBarChart(scores, mean, standardDeviation)
        lastFiveQuizzesVsAll(scores, mean)
        resultsOverTime(scores, dates)
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
        scoreByDay[daysCompleted[i]] += scores[i]
    }

    new Chart(scoresByDayChart, {
        type: "bar",
        data: {
            labels: dayNames,
            datasets: [{
                label: "Score",
                data: scoreByDay,
                backgroundColor: "rgba(75, 192, 192, 0.2)",
                borderColor: "rgba(75, 192, 192, 1)",
                borderWidth: 1
            }]
        }
    });
};

renderNormalDistBarChart = (scores, mean, standardDeviation) => {
    potentialScores = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110]
    achievedScores = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

    scores.forEach(score => {
        achievedScoresIndex = score/10
        achievedScores[achievedScoresIndex] += 1
    })

    let normalValues = []

    for(let i=0; i<121; i++){
        normalValues.push({
            x: i/10,
            y: Nx(i, mean, standardDeviation),
        })
    }

    new Chart(normalChart, {
        data: {
            labels: potentialScores,
            datasets: [
                {
                    type: "bar",
                    label: "scores",
                    data: achievedScores,
                },
                {
                    type: "line",
                    label: "normal distribution",
                    data: normalValues,
                    tension: 0.4,
                    pointRadius: 0,
                    fill: false,
                    parsing:false,
                }
            ]
        }
    })
};

Nx = (x, mu, sigma) => {
    let coef = 1/(sigma*Math.sqrt(2*Math.PI))
    let ex = Math.pow(Math.E, -1*(Math.pow(x-mu, 2))/(2*Math.pow(sigma, 2)))
    return coef*ex
}

lastFiveQuizzesVsAll = (scores, mean) => {
    let lastFiveScores = []
    for(let i=-1; i>-6; i-=1){
        lastFiveScores.push(scores[scores.length + i])
    }

    const temp = calculateMeanAndStandardDeviation(lastFiveScores, 5)
    const lastFiveScoresMean = temp[0]

    if(lastFiveScoresMean > mean){
        lastFiveText.innerText = "Your mean in the last five quizzes is " + lastFiveScoresMean + " up from " + mean + " overall."
    } else if(lastFiveScoresMean < mean) {
        lastFiveText.innerText = "Your mean in the last five quizzes is " + lastFiveScoresMean + " down from " + mean + " overall."
    } else {
        lastFiveText.innerText = "Your mean in the last five quizzes is the same as overall at, " + lastFiveScoresMean + " keepin' it steady"
    }
}

resultsOverTime = (scores, dates) => {
    let timeSinceFirst = [0]
    let total = 0
    for(let i = 0; i<scores.length -1; i++){
        const difference = dates[i+1]-dates[i]
        total += difference
        timeSinceFirst.push(total)
    }

    const reducer = timeSinceFirst[timeSinceFirst.length-1]/100
    timeSinceFirst = timeSinceFirst.map(t => t / reducer)

    console.log(scores)
    console.log(timeSinceFirst)

    const temp = calculateLineOfBestFit(timeSinceFirst, scores)
    const m = temp[0]
    const c = temp[1]
    console.log(m, c)

    // format points for plotting

    let scatterPoints = []
    for(let i = 0; i<scores.length; i++){
        scatterPoints.push({
            x: timeSinceFirst[i],
            y: scores[i],
        })
    }

    const point1 = {
        x: 0,
        y: c,
    }
    
    const finalx = timeSinceFirst[timeSinceFirst.length-1]
    const point2 = {
        x: finalx,
        y: finalx*m + c
    }

    const linePoints = [point1, point2]
    console.log(linePoints)
    console.log(scatterPoints)

    new Chart(linearChart, {
        data: {
            datasets: [{
                type: "scatter",
                label: "scores",
                data: scatterPoints,
            }, {
                type: "line",
                label: "line of best fit",
                data: linePoints,
                pointRadius: 0,
                fill: false,
                parsing:false,
            }],
        }
    })
}

calculateLineOfBestFit = (x, y) => {
    const mux = calculateMeanAndStandardDeviation(x, x.length)[0]
    const muy = calculateMeanAndStandardDeviation(y, y.length)[0]

    const sxy = Sxy(x, y, mux, muy)
    const sxx = Sxy(x, x, mux, mux)

    const m = sxy/sxx
    const c = muy-m*mux

    return [m, c]
}

Sxy = (x, y, mux, muy) => {
    let sxy = 0
    for(let i=0; i<x.length; i++) {
        sxy += (x[i]-mux)*(y[i]-muy)
    }
    return sxy
}

init()