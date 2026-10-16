*** Settings ***
Documentation     ตรวจการเชื่อมต่อ API จริง (Live API smoke)
Resource          resources/app.resource
Suite Setup       Start Test Environment
Suite Teardown    Stop Test Environment
Test Teardown     Close Test Context
Force Tags        live

*** Test Cases ***
LIVE-CONV-01 เชื่อมต่อ API จริงและคำนวณค่าเงินได้
    [Tags]    live
    Open App And Wait For Live
    ${result}=    Get Text    ${RESULT}
    Should Not Be Equal    ${result}    —
    Get Text    ${RATELINE}    *=    USD
    Get Text    ${RATELINE}    *=    THB

LIVE-CONV-02 เปลี่ยนจำนวนเงินตามอัตราจริง
    [Tags]    live-conversion
    Open App And Wait For Live
    Fill Text    ${AMOUNT}    2
    Get Text    ${RESULT}    matches    ^[0-9,.]+ THB$

LIVE-CONV-03 เปลี่ยนสกุลปลายทางและตรวจผลลัพธ์
    [Tags]    live-conversion
    Open App And Wait For Live
    Select Options By    ${TO}    value    JPY
    Get Text    ${RESULT}    matches    ^[0-9,.]+ JPY$
    Get Text    ${RATELINE}    *=    USD
    Get Text    ${RATELINE}    *=    JPY

LIVE-CONV-04 สลับสกุลและตรวจผลลัพธ์
    [Tags]    live-conversion
    Open App And Wait For Live
    Click    ${SWAP}
    Get Selected Options    ${FROM}    value    ==    THB
    Get Selected Options    ${TO}    value    ==    USD
    Get Text    ${RESULT}    matches    ^[0-9,.]+ USD$

LIVE-CONV-05 สกุลเดียวกันให้ค่าเท่าจำนวนเงิน
    [Tags]    live-conversion
    Open App And Wait For Live
    Select Options By    ${FROM}    value    EUR
    Select Options By    ${TO}    value    EUR
    Get Text    ${RESULT}    ==    1,000 EUR
