*** Settings ***
Documentation     การแปลงค่าเงิน (TC-CONV-*)
Resource          resources/app.resource
Suite Setup       Start Test Environment
Suite Teardown    Stop Test Environment
Test Setup        Reset Mock
Test Teardown     Close Test Context
Force Tags        conversion

*** Test Cases ***
TC-CONV-01 แสดงผลเริ่มต้น 1,000 USD → THB
    [Tags]    smoke    TC-CONV-01
    Open App And Wait For Live
    Get Property    ${AMOUNT}    value    ==    1000
    Get Selected Options    ${FROM}    value    ==    USD
    Get Selected Options    ${TO}    value    ==    THB
    Result Should Be    35,000 THB

TC-CONV-02 เปลี่ยนจำนวนเงินแล้วผลลัพธ์เปลี่ยนทันที
    [Tags]    smoke    TC-CONV-02
    Open App And Wait For Live
    Fill Text    ${AMOUNT}    2
    Result Should Be    70 THB

TC-CONV-03 เปลี่ยนสกุลปลายทางเป็น JPY
    [Tags]    TC-CONV-03
    Open App And Wait For Live
    Select Options By    ${TO}    value    JPY
    Result Should Be    150,000 JPY

TC-CONV-04 ปุ่มสลับสกุล
    [Tags]    TC-CONV-04
    Open App And Wait For Live
    Click    ${SWAP}
    Get Selected Options    ${FROM}    value    ==    THB
    Get Selected Options    ${TO}    value    ==    USD
    Result Should Be    28.5714 USD

TC-CONV-05 แสดงอัตราแลกเปลี่ยนทั้งสองทิศทาง
    [Tags]    TC-CONV-05
    Open App And Wait For Live
    Get Text    ${RATELINE}    *=    1 USD = 35 THB
    Get Text    ${RATELINE}    *=    1 THB = 0.028571 USD

TC-CONV-06 จำนวนเงินว่างหรือ 0 แสดงผลเป็น 0
    [Tags]    TC-CONV-06
    Open App And Wait For Live
    Fill Text    ${AMOUNT}    ${EMPTY}
    Result Should Be    0 THB
    Fill Text    ${AMOUNT}    0
    Result Should Be    0 THB

TC-CONV-07 สกุลต้นทางและปลายทางเหมือนกัน
    [Tags]    TC-CONV-07
    Open App And Wait For Live
    Select Options By    ${FROM}    value    EUR
    Select Options By    ${TO}    value    EUR
    Result Should Be    1,000 EUR
