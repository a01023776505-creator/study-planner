
const subjectCheckboxes = document.querySelectorAll(
    'input[name="subject"]'
);

const dateContainer = document.getElementById("subjectExamDates");
const createPlanButton = document.getElementById("createPlanButton");
const result = document.getElementById("result");

// 선택한 과목에 맞춰 시험 날짜 입력칸 생성
function updateSubjectExamDates() {
    const selectedSubjects = Array.from(subjectCheckboxes)
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.value);

    const previousDates = {};

    dateContainer.querySelectorAll("input[type='date']").forEach(input => {
        previousDates[input.dataset.subject] = input.value;
    });

    dateContainer.innerHTML = "";

    if (selectedSubjects.length === 0) {
        dateContainer.innerHTML = `
            <p class="empty-message">
                먼저 공부할 과목을 선택해 주세요.
            </p>
        `;
        return;
    }

    selectedSubjects.forEach(subject => {
        const row = document.createElement("div");
        row.className = "date-row";

        const label = document.createElement("label");
        label.textContent = subject + " 시험 날짜";

        const dateInput = document.createElement("input");
        dateInput.type = "date";
        dateInput.dataset.subject = subject;
        dateInput.required = true;

        if (previousDates[subject]) {
            dateInput.value = previousDates[subject];
        }

        row.appendChild(label);
        row.appendChild(dateInput);

        dateContainer.appendChild(row);
    });
}

// 날짜를 YYYY-MM-DD 형태로 변환
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

// 날짜 차이 계산
function getDateDifference(startDate, endDate) {
    const start = new Date(startDate + "T00:00:00");
    const end = new Date(endDate + "T00:00:00");

    return Math.round((end - start) / (1000 * 60 * 60 * 24));
}

// 공부 계획표 생성
function createPlan() {
    const grade = document.getElementById("grade").value;
    const major = document.getElementById("major").value.trim();
    const studyTime = Number(
        document.getElementById("studyTime").value
    );

    const selectedSubjects = Array.from(subjectCheckboxes)
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.value);

    if (!grade) {
        result.innerHTML = `
            <p class="error-message">학년을 선택해 주세요.</p>
        `;
        return;
    }

    if (!studyTime || studyTime < 1 || studyTime > 24) {
        result.innerHTML = `
            <p class="error-message">
                하루 공부 가능 시간을 1~24시간 사이로 입력해 주세요.
            </p>
        `;
        return;
    }

    if (selectedSubjects.length === 0) {
        result.innerHTML = `
            <p class="error-message">공부할 과목을 선택해 주세요.</p>
        `;
        return;
    }

    const subjectDates = {};

    for (const subject of selectedSubjects) {
        const dateInput = dateContainer.querySelector(
            `input[data-subject="${subject}"]`
        );

        if (!dateInput || !dateInput.value) {
            result.innerHTML = `
                <p class="error-message">
                    ${subject}의 시험 날짜를 지정해 주세요.
                </p>
            `;
            return;
        }

        subjectDates[subject] = dateInput.value;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayString = formatDate(today);

    for (const subject of selectedSubjects) {
        if (subjectDates[subject] < todayString) {
            result.innerHTML = `
                <p class="error-message">
                    ${subject}의 시험 날짜가 오늘보다 이전입니다.
                    날짜를 다시 확인해 주세요.
                </p>
            `;
            return;
        }
    }

    const latestDate = selectedSubjects
        .map(subject => subjectDates[subject])
        .sort()
        .pop();

    const totalDays = getDateDifference(todayString, latestDate) + 1;

    if (totalDays <= 0) {
        result.innerHTML = `
            <p class="error-message">
                시험 날짜를 다시 확인해 주세요.
            </p>
        `;
        return;
    }

    const dailyMinutes = studyTime * 60;

    let planHTML = `
        <h3>공부 계획표</h3>
        <p><strong>학년:</strong> ${grade}</p>
        <p><strong>희망 학과:</strong> ${major || "입력하지 않음"}</p>
        <p><strong>하루 공부 시간:</strong> ${studyTime}시간</p>
        <p><strong>계획 기간:</strong> ${todayString} ~ ${latestDate}</p>
    `;

    for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() + dayIndex);

        const currentDateString = formatDate(currentDate);

        const availableSubjects = selectedSubjects.filter(subject => {
            return subjectDates[subject] >= currentDateString;
        });

        if (availableSubjects.length === 0) {
            continue;
        }

        // 시험이 가까운 과목에 더 많은 비중을 배정
        const weights = availableSubjects.map(subject => {
            const daysLeft = Math.max(
                1,
                getDateDifference(currentDateString, subjectDates[subject]) + 1
            );

            return 1 / daysLeft;
        });

        const totalWeight = weights.reduce(
            (sum, weight) => sum + weight,
            0
        );

        let assignedMinutes = 0;

        planHTML += `
            <div class="plan-day">
                <h3>${currentDateString}</h3>
        `;

        availableSubjects.forEach((subject, index) => {
            let minutes;

            if (index === availableSubjects.length - 1) {
                minutes = dailyMinutes - assignedMinutes;
            } else {
                minutes = Math.round(
                    dailyMinutes * weights[index] / totalWeight
                );

                assignedMinutes += minutes;
            }

            const hours = Math.floor(minutes / 60);
            const remainingMinutes = minutes % 60;

            let timeText = "";

            if (hours > 0) {
                timeText += `${hours}시간 `;
            }

            if (remainingMinutes > 0) {
                timeText += `${remainingMinutes}분`;
            }

            if (minutes === 0) {
                timeText = "0분";
            }

            planHTML += `
                <div class="plan-item">
                    <strong>${subject}</strong>
                    <span> - ${timeText}</span>
                    <br>
                    <small>시험 날짜: ${subjectDates[subject]}</small>
                </div>
            `;
        });

        planHTML += `</div>`;
    }

    result.innerHTML = planHTML;
}

// 과목 체크 상태가 바뀔 때 날짜 입력칸 갱신
subjectCheckboxes.forEach(checkbox => {
    checkbox.addEventListener("change", updateSubjectExamDates);
});

// 버튼 클릭 시 계획표 생성
createPlanButton.addEventListener("click", createPlan);

// 페이지를 처음 열었을 때 안내 문구 표시
updateSubjectExamDates();
