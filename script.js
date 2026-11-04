
const subjectCheckboxes = document.querySelectorAll(
    'input[name="subject"]'
);

const dateContainer = document.getElementById("subjectExamDates");
const createPlanButton = document.getElementById("createPlanButton");
const result = document.getElementById("result");

// 날짜 입력칸 생성
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

        if (previousDates[subject]) {
            dateInput.value = previousDates[subject];
        }

        row.appendChild(label);
        row.appendChild(dateInput);

        dateContainer.appendChild(row);
    });
}

// 날짜를 YYYY-MM-DD 형식으로 변환
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

    return Math.round(
        (end - start) / (1000 * 60 * 60 * 24)
    );
}

// 분 단위를 시간과 분으로 변환
function formatStudyTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0 && remainingMinutes > 0) {
        return `${hours}시간 ${remainingMinutes}분`;
    }

    if (hours > 0) {
        return `${hours}시간`;
    }

    return `${remainingMinutes}분`;
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

    // 입력 확인
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
            <p class="error-message">
                공부할 과목을 선택해 주세요.
            </p>
        `;
        return;
    }

    // 과목별 시험 날짜 확인
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

    // 오늘 날짜 설정
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayString = formatDate(today);

    // 시험 날짜가 오늘보다 이전인지 확인
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

    // 가장 늦은 시험 날짜 확인
    const latestDate = selectedSubjects
        .map(subject => subjectDates[subject])
        .sort()
        .pop();

    const totalDays =
        getDateDifference(todayString, latestDate) + 1;

    const dailyMinutes = studyTime * 60;

    // 주간 계획표 상단 요약
    let planHTML = `
        <div class="plan-summary">
            <h3>📚 공부 계획 요약</h3>
            <p><strong>학년:</strong> ${grade}</p>
            <p><strong>희망 학과:</strong> ${major || "입력하지 않음"}</p>
            <p><strong>하루 공부 시간:</strong> ${studyTime}시간</p>
            <p><strong>계획 기간:</strong> ${todayString} ~ ${latestDate}</p>
            <p><strong>선택한 과목:</strong> ${selectedSubjects.join(", ")}</p>
        </div>
    `;

    let currentWeek = 0;
    let weekStarted = false;

    // 7일 단위로 계획표 생성
    for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
        const currentDate = new Date(today);

        currentDate.setDate(
            today.getDate() + dayIndex
        );

        const currentDateString = formatDate(currentDate);

        const weekNumber = Math.floor(dayIndex / 7) + 1;

        // 주차가 바뀌면 새 주간 카드 생성
        if (weekNumber !== currentWeek) {
            if (weekStarted) {
                planHTML += `
                    </div>
                    </div>
                `;
            }

            currentWeek = weekNumber;
            weekStarted = true;

            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() + (weekNumber - 1) * 7);

            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);

            if (weekEnd > new Date(latestDate + "T00:00:00")) {
                weekEnd.setTime(
                    new Date(latestDate + "T00:00:00").getTime()
                );
            }

            planHTML += `
                <div class="week-card">
                    <div class="week-header">
                        <h3>${weekNumber}주차 공부 계획</h3>
                        <p>
                            ${formatDate(weekStart)}
                            ~
                            ${formatDate(weekEnd)}
                        </p>
                    </div>

                    <div class="week-content">
            `;
        }

        // 해당 날짜에 공부할 과목
        const availableSubjects = selectedSubjects.filter(subject => {
            return subjectDates[subject] >= currentDateString;
        });

        // 모든 시험이 끝난 날짜는 표시하지 않음
        if (availableSubjects.length === 0) {
            continue;
        }

        // 시험이 가까운 과목에 더 많은 시간 배정
        const weights = availableSubjects.map(subject => {
            const daysLeft = Math.max(
                1,
                getDateDifference(
                    currentDateString,
                    subjectDates[subject]
                ) + 1
            );

            return 1 / daysLeft;
        });

        const totalWeight = weights.reduce(
            (sum, weight) => sum + weight,
            0
        );

        // 시간 배분
        const allocatedMinutes = [];
        let assignedMinutes = 0;

        availableSubjects.forEach((subject, index) => {
            let minutes;

            if (index === availableSubjects.length - 1) {
                minutes = dailyMinutes - assignedMinutes;
            } else {
                minutes = Math.floor(
                    dailyMinutes *
                    weights[index] /
                    totalWeight
                );

                assignedMinutes += minutes;
            }

            allocatedMinutes.push(minutes);
        });

        // 하루 계획 카드
        const dayOfWeek = [
            "일요일",
            "월요일",
            "화요일",
            "수요일",
            "목요일",
            "금요일",
            "토요일"
        ];

        const dayName = dayOfWeek[currentDate.getDay()];

        planHTML += `
            <div class="day-card">
                <div class="day-header">
                    <h4>
                        ${currentDateString}
                        (${dayName})
                    </h4>

                    <span class="day-total">
                        총 ${studyTime}시간
                    </span>
                </div>
        `;

        // 과목별 공부 시간 표시
        availableSubjects.forEach((subject, index) => {
            const minutes = allocatedMinutes[index];

            planHTML += `
                <div class="study-item">
                    <div>
                        <div class="study-subject">
                            ${subject}
                        </div>

                        <span class="exam-label">
                            시험일: ${subjectDates[subject]}
                        </span>
                    </div>

                    <div class="study-time">
                        ${formatStudyTime(minutes)}
                    </div>
                </div>
            `;
        });

        planHTML += `
            </div>
        `;
    }

    // 마지막 주간 카드 닫기
    if (weekStarted) {
        planHTML += `
            </div>
            </div>
        `;
    }

    result.innerHTML = planHTML;
}

// 과목 선택에 따라 날짜 입력칸 갱신
subjectCheckboxes.forEach(checkbox => {
    checkbox.addEventListener(
        "change",
        updateSubjectExamDates
    );
});

// 계획표 생성 버튼
createPlanButton.addEventListener(
    "click",
    createPlan
);

// 처음 페이지를 열었을 때
updateSubjectExamDates();
