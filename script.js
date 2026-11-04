
function createPlan() {

    // 1. 학생이 입력한 정보 가져오기
    const grade = document.getElementById("grade").value;
    const examDate = document.getElementById("examDate").value;
    const studyTime = Number(document.getElementById("studyTime").value);
const major = document.getElementById("major").value;
    // 2. 선택한 과목 가져오기
    const checkboxes = document.querySelectorAll(
        'input[name="subject"]:checked'
    );

    const subjects = Array.from(checkboxes).map(
        checkbox => checkbox.value
    );

    const result = document.getElementById("result");

    // 3. 입력 정보 확인하기
    if (examDate === "") {
        result.textContent = "시험 날짜를 입력해 주세요.";
        return;
    }

    if (studyTime <= 0 || studyTime > 24) {
        result.textContent = "하루 공부 시간을 1~24시간으로 입력해 주세요.";
        return;
    }

    if (subjects.length === 0) {
        result.textContent = "공부할 과목을 하나 이상 선택해 주세요.";
        return;
    }

    // 4. 시험까지 남은 날짜 계산하기
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const exam = new Date(examDate + "T00:00:00");

    const remainingDays = Math.ceil(
        (exam - today) / (1000 * 60 * 60 * 24)
    );

    if (remainingDays < 0) {
        result.textContent = "시험 날짜가 이미 지났습니다.";
        return;
    }

    // 5. 과목별 공부 시간 나누기
    const totalMinutes = studyTime * 60;

    const baseMinutes = Math.floor(
        totalMinutes / subjects.length
    );

    const extraMinutes = totalMinutes % subjects.length;

    // 6. 계획표 만들기
    let plan = `
        <h3>나의 공부 계획표</h3>

        <p><strong>학년:</strong> ${grade}</p>
        <p><strong>희망 학과:</strong> ${major}</p>
        <p><strong>시험 날짜:</strong> ${examDate}</p>
        <p><strong>시험까지:</strong> ${remainingDays}일</p>
        <p><strong>하루 공부 시간:</strong> ${studyTime}시간</p>

        <table style="
            width:100%;
            border-collapse:collapse;
            text-align:center;
        ">
            <tr style="background-color:#4169e1;color:white;">
                <th style="padding:10px;">과목</th>
                <th style="padding:10px;">공부 시간</th>
            </tr>
    `;

    subjects.forEach((subject, index) => {

        const minutes = baseMinutes +
            (index < extraMinutes ? 1 : 0);

        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;

        let timeText = "";

        if (hours > 0) {
            timeText += hours + "시간 ";
        }

        if (mins > 0) {
            timeText += mins + "분";
        }

        if (minutes === 0) {
            timeText = "0분";
        }

        plan += `
            <tr>
                <td style="padding:10px;border-bottom:1px solid #ddd;">
                    ${subject}
                </td>

                <td style="padding:10px;border-bottom:1px solid #ddd;">
                    ${timeText}
                </td>
            </tr>
        `;
    });

    plan += `
        </table>

        <p style="margin-top:20px;">
            오늘의 계획을 하나씩 실천해 보세요!
        </p>
    `;

    // 7. 결과 화면에 표시하기
    result.innerHTML = plan;
}
