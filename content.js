(function () {
    const QUIZ_STORAGE_KEY = "udemy_quiz_tracker";

    function getSelectedAnswer() {
        const inputs = document.querySelectorAll('input[data-index]');
        for (const input of inputs) {
            if (input.checked) return input;
        }
        return null;
    }

    function getAllAnswers() {
        const labels = document.querySelectorAll("form ul li label");
        return Array.from(labels).map((label, index) => {
            const input = label.querySelector("input[data-index]");
            const text = label.innerText.trim();
            const isCorrect = label.querySelector("strong")?.innerText.includes("Correct") || false;
            const isSelected = input?.checked || false;

            return {
                text,
                isCorrect,
                isSelected,
            };
        });
    }

    function getFeedbackText(input) {
        const feedbackEl = input?.closest("label")?.querySelector(".ud-text-sm p");
        return feedbackEl ? feedbackEl.innerText.trim() : null;
    }

    function extractQuestionText() {
        const el = document.querySelector("#question-prompt > p");
        return el ? el.innerText.trim() : "Unknown Question";
    }

    function saveQuestionToStorage(data) {
        let existing = JSON.parse(localStorage.getItem(QUIZ_STORAGE_KEY)) || [];
        existing.push(data);
        localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(existing));
        deduplicateStoredQuestions();
    }

    function deduplicateStoredQuestions() {
        let existing = JSON.parse(localStorage.getItem(QUIZ_STORAGE_KEY)) || [];

        existing = existing.sort(function(x, y){
            return new Date(y.timestamp) - new Date(x.timestamp);
        })
        
        const seen = new Map();
        for (let i = existing.length - 1; i >= 0; i--) {
            const questionText = existing[i].question;

            if (seen.has(questionText)) {
                const currentStored = seen.get(questionText);
                if (currentStored.timestamp < existing[i].timestamp) {
                    if (currentStored.isCorrect === false) {
                        existing[i].isCorrect = false;
                    }
                    seen.set(questionText, existing[i]);
                }
            } else {
                seen.set(questionText, existing[i]);
            }
        }

        const deduplicated = Array.from(seen.values());

        localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(deduplicated));
        console.log(`🧹 Deduplicated: ${existing.length} → ${deduplicated.length}`);
    }

    function handleQuestionSubmit() {
        const selected = getSelectedAnswer();
        if (!selected) {
            console.log("No answer selected ... aborting submit.");
            return;
        }

        const isCorrect = selected
            .closest("label")
            ?.querySelector("strong")
            ?.innerText.includes("Correct");

        const answers = getAllAnswers();
        const correctAnswer = answers.find(a => a.isCorrect)?.text || "Unknown";
        const selectedAnswer = answers.find(a => a.isSelected)?.text || "None selected";
        const explanation = getFeedbackText(selected) || "No explanation found.";

        const questionData = {
            question: extractQuestionText(),
            answers,
            selectedAnswer,
            correctAnswer,
            isCorrect: !!isCorrect,
            explanation,
            timestamp: new Date().toISOString(),
        };

        console.log("📌 Quiz data:", questionData);
        saveQuestionToStorage(questionData);
    }

    function setupListener() {
        const checkForNextButton = setInterval(() => {
            const nextButton = document.querySelector('[data-testid="next-question-button"]');

            if (nextButton) {
                clearInterval(checkForNextButton);
                console.log("✅ Next button found.");

                nextButton.addEventListener("click", () => {
                    console.log("➡️ Next button clicked.");
                    handleQuestionSubmit();
                });
            } else {
                console.log("⏳ Waiting for next button...");
            }
        }, 1000);

        console.log("✅ Udemy Quiz Tracker is running...");
    }

    function exportQuizData() {
        const data = localStorage.getItem(QUIZ_STORAGE_KEY);
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "udemy-quiz-data.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    function logQuizDataToConsole() {
        const data = localStorage.getItem(QUIZ_STORAGE_KEY);
        if (!data) {
            console.log("⚠️ No quiz data found in localStorage.");
            return;
        }

        const parsedData = JSON.parse(data);
        console.log("📚 Udemy Quiz Data:");
        parsedData.forEach((entry, index) => {
            console.log(`\n#${index + 1}`);
            console.log(`Question: ${entry.question}`);
            console.log(`Selected Answer: ${entry.selectedAnswer}`);
            console.log(`Correct Answer: ${entry.correctAnswer}`);
            console.log(`Correct: ${entry.isCorrect ? "✅ Yes" : "❌ No"}`);
            console.log(`Explanation: ${entry.explanation}`);
            console.log(`Answers:`);
            entry.answers.forEach((a, i) => {
                console.log(`  - [${a.isSelected ? "✔" : " "}] ${a.text} ${a.isCorrect ? "(✅ Correct)" : ""}`);
            });
            console.log(`Timestamp: ${entry.timestamp}`);
        });
    }

    setupListener();
})();
