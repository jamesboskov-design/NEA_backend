const question = document.getElementById("question");
const choices = Array.from(document.getElementsByClassName("choice-text"));
const choiceContainers = Array.from(document.getElementsByClassName("choice-container"));
const progressText = document.getElementById("progressText");
const scoreText = document.getElementById("score");
const timerText = document.getElementById("timer");
const progressBarFull = document.getElementById("progressBarFull");

let answeredQ = false
let currentQuestion = {};
let acceptingAnswers = false;
let score = 0
let questionCounter = 0;
let availableQuestions = [];
let total_time_elapsed = 0

let questions = []

const decodeHTML = txt => {
    const html = document.createElement("textarea");
    html.innerHTML = txt;
    return html.innerText;
}

fetch("https://opentdb.com/api.php?amount=10&type=multiple")
    .then( res => {
        return res.json();
    })
    .then(loadedQuestions => {
        questions = loadedQuestions.results.map( loadedQuestion => {
            const decoded_question = decodeHTML(loadedQuestion.question)
            const formattedQuestion = {
                question: decoded_question
            }
            let answerChoices = [...loadedQuestion.incorrect_answers];
            formattedQuestion.answer = Math.floor(Math.random()*4)+1;
            answerChoices.splice(formattedQuestion.answer -1, 0, loadedQuestion.correct_answer);
            answerChoices.forEach((choice, index) => {
                formattedQuestion["choice" + (index+1)] = decodeHTML(choice);
            })
            return formattedQuestion
        })
        startGame()
    })
    .catch(err => {
        console.error(err)
    });

//CONSTS
const CORRECT_BONUS = 10;
const MAX_QUESTIONS = 10;
const TIMERLENGTH = 20;

const startGame = () => {
    questionCounter = 0;
    score = 0;
    scoreText.innerText = score
    availableQuestions = [...questions];
    getNewQuestion();
}

const getNewQuestion = () => {
    if(availableQuestions.length == 0 || questionCounter > MAX_QUESTIONS-1){

        localStorage.setItem("quizScore", score);
        
        fetch("/quizData", {
            method : "POST",
            body : JSON.stringify({
                score: score,
                time_elapsed: total_time_elapsed,
                date_of_completion: new Date()
            }),
            headers : {
                "Content-type": "application/json; charset=UTF-8"
            }
        });

        // go to the end page
        return window.location.assign("/end")
    };

    timer(TIMERLENGTH)

    questionCounter++;
    progressText.innerText = "question " + questionCounter + "/" + MAX_QUESTIONS;
    // update the progress bar
    progressBarFull.style.width = ((questionCounter/MAX_QUESTIONS)*100).toString() + "%"

    const questionIndex = Math.floor(Math.random() * availableQuestions.length);
    currentQuestion = availableQuestions[questionIndex];
    question.innerText = currentQuestion.question;
    console.log("the correct answer is answer number " + currentQuestion.answer)

    choices.forEach(choice => {
        const number = choice.dataset["number"];
        choice.innerText = currentQuestion["choice" + number]
    });

    availableQuestions.splice(questionIndex, 1);

    acceptingAnswers = true;
} 

choiceContainers.forEach(choiceContainer => {
    choiceContainer.addEventListener("click", e => {
        if(!acceptingAnswers) return;

        acceptingAnswers = false;
        const selectedChoice = e.target;
        const selectedAnswer = selectedChoice.dataset["number"];

        let classToApply = "incorrect";
        if(selectedAnswer == currentQuestion.answer){
            classToApply = "correct";
        };
        
        if(classToApply == "correct"){
            incrementScore(CORRECT_BONUS)
        };

        let target_type = Array.from(selectedChoice.classList)[0];
        let selectedChoiceContainer = null;

        if(target_type == "choice-text"){
            selectedChoiceContainer = selectedChoice.parentElement;
        } else {
            selectedChoiceContainer = selectedChoice;
        };

        selectedChoiceContainer.classList.add(classToApply);

        answeredQ = true
        setTimeout( () => {
            selectedChoiceContainer.classList.remove(classToApply);
            getNewQuestion();
        }, 1000);
    })
})

const timer = start_time => {
    timerText.innerHTML = start_time
    return incrementTimer(start_time-1)
}

const incrementTimer = num => {
    setTimeout( () => {
        if(answeredQ){
            answeredQ=false;
            return
        }

        timerText.innerHTML = num;
        num-=1;
        total_time_elapsed+=1;
        if(!num==0){
            incrementTimer(num);
        } else {
            setTimeout( () => {
                if (answeredQ) {
                    answeredQ=false
                } else {
                    timerText.innerHTML = 0;
                    timeOut()
                };
            }, 1000);
            return;
        };
        }, 1000);
};

const timeOut = () => {
    acceptingAnswers = false

    choiceContainers.forEach(choiceContainer => {
        choiceContainer.classList.add("incorrect");

        setTimeout( () => {
            choiceContainer.classList.remove("incorrect");
        }, 1000);
    });
    setTimeout( () => {
        getNewQuestion();
    }, 1000);
};

const incrementScore = num => {
    score += num;
    scoreText.innerText = score
};