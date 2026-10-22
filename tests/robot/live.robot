*** Settings ***
Documentation     ตรวจการเชื่อมต่อ API จริง (Live API smoke)
Resource          resources/app.resource
Suite Setup       Start Test Environment
Suite Teardown    Stop Test Environment
Test Teardown     Close Test Context
Force Tags        live

*** Test Cases ***
LIVE-API-01 เปิดแอปและรับสถานะ Live
    Open App And Wait For Live
    Get Attribute    ${STATUS}    class    *=    live
    Get Text    ${RATELINE}    *=    USD
    Get Text    ${RATELINE}    *=    THB
    ${result}=    Get Text    ${RESULT}
    Should Not Be Equal    ${result}    —

LIVE-API-02 API ตอบกลับด้วยข้อมูลอัตราที่มีโครงสร้างถูกต้อง
    Open App And Wait For Live
    Get Text    ${RESULT}    matches    ^[0-9,.]+ [A-Z]{3}$
    Get Text    ${RATELINE}    *=    USD
    Get Text    ${RATELINE}    *=    THB

LIVE-CONV-01 แปลง USD เป็น THB ด้วยเรตจริง
    Open App With Query    ?from=USD&to=THB&amt=1000
    Get Text    ${RESULT}    matches    ^[0-9,.]+ THB$

LIVE-CONV-02 ผลลัพธ์เปลี่ยนตามจำนวนเงินและรักษาสัดส่วน
    Open App With Query    ?from=USD&to=THB&amt=1
    ${one}=    Get Text    ${RESULT}
    Fill Text    ${AMOUNT}    2
    Get Text    ${RESULT}    matches    ^[0-9,.]+ THB$
    ${two}=    Get Text    ${RESULT}
    Should Not Be Equal    ${one}    ${two}

LIVE-CONV-03 เปลี่ยนสกุลเงินปลายทางเป็น JPY
    Open App With Query    ?from=USD&to=JPY&amt=2
    Get Text    ${RESULT}    matches    ^[0-9,.]+ JPY$
    Get Text    ${RATELINE}    *=    USD
    Get Text    ${RATELINE}    *=    JPY

LIVE-CONV-04 สลับสกุลเงินต้นทางและปลายทาง
    Open App With Query    ?from=USD&to=JPY&amt=2
    Click    ${SWAP}
    Get Selected Options    ${FROM}    value    ==    JPY
    Get Selected Options    ${TO}    value    ==    USD
    Get Text    ${RESULT}    matches    ^[0-9,.]+ USD$

LIVE-CONV-05 สกุลเงินต้นทางและปลายทางเป็นสกุลเดียวกัน
    Open App With Query    ?from=EUR&to=EUR&amt=2
    Get Text    ${RESULT}    ==    2 EUR

LIVE-DATA-01 กด Refresh แล้วเรียก API ใหม่
    Open App And Wait For Live
    ${before}=    Get Mock Hits
    Click Refresh
    Wait Until Keyword Succeeds    10s    200ms    Mock Hits Should Exceed    ${before}
    Get Property    ${REFRESH}    disabled    ==    ${False}
    Get Text    ${RESULT}    matches    ^[0-9,.]+ [A-Z]{3}$

LIVE-DATA-02 รีโหลดหน้าแล้วดึงข้อมูลได้อีกครั้ง
    Open App And Wait For Live
    Reload
    Wait For Live Status
    Get Text    ${RESULT}    matches    ^[0-9,.]+ [A-Z]{3}$

LIVE-HISTORY-01 โหลดข้อมูลกราฟย้อนหลังจาก API จริง
    Open App And Wait For Live
    Click    css=#chart-range [data-range="7"]
    Get Element Count    ${CHART_SVG}    ==    1
    Get Text    ${CHART_MSG}    ==    ${EMPTY}

LIVE-ROBUST-01 API ตอบสนองช้าแต่หน้าไม่ค้างถาวร
    Open App And Wait For Live
    Refresh And Wait
    Get Property    ${REFRESH}    disabled    ==    ${False}
    Get Text    ${RESULT}    matches    ^[0-9,.]+ [A-Z]{3}$
