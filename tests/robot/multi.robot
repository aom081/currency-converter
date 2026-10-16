*** Settings ***
Documentation     แปลงเป็นหลายสกุลพร้อมกัน (TC-MULTI-*)
Resource          resources/app.resource
Suite Setup       Start Test Environment
Suite Teardown    Stop Test Environment
Test Setup        Reset Mock
Test Teardown     Close Test Context
Force Tags        multi

*** Test Cases ***
TC-MULTI-01 ยังไม่ติดตามสกุลใด แสดงข้อความแนะนำ
    [Tags]    smoke    TC-MULTI-01
    Open App And Wait For Live
    Get Element Count    ${MULTI_ROWS}    ==    0
    Get Text    css=#multi .empty    *=    ติดตามสกุลเงิน

TC-MULTI-02 แสดงผลทุกสกุลที่ติดตาม
    [Tags]    smoke    TC-MULTI-02
    Open App And Wait For Live
    Star From List    JPY
    Star From List    EUR
    Star From List    GBP
    Get Text    ${MULTI_HEAD}    ==    จาก 1,000 USD
    Get Element Count    ${MULTI_ROWS}    ==    3
    Get Text    css=[data-multi="JPY"] .mval    ==    150,000 JPY
    Get Text    css=[data-multi="EUR"] .mval    ==    900 EUR
    Get Text    css=[data-multi="GBP"] .mval    ==    800 GBP

TC-MULTI-03 เปลี่ยนจำนวนเงินแล้วตารางเปลี่ยนตาม
    [Tags]    TC-MULTI-03
    Open App And Wait For Live
    Star From List    JPY
    Star From List    EUR
    Fill Text    ${AMOUNT}    2
    Get Text    ${MULTI_HEAD}    ==    จาก 2 USD
    Get Text    css=[data-multi="JPY"] .mval    ==    300 JPY
    Get Text    css=[data-multi="EUR"] .mval    ==    1.8 EUR

TC-MULTI-04 เปลี่ยนสกุลต้นทาง และไม่แสดงแถวของสกุลต้นทางเอง
    [Tags]    TC-MULTI-04
    Open App And Wait For Live
    Star From List    THB
    Star From List    JPY
    Star From List    EUR
    Select Options By    ${FROM}    value    THB
    Get Element Count    ${MULTI_ROWS}    ==    2
    Get Text    css=[data-multi="JPY"] .mval    ==    4,285.71 JPY
    Get Text    css=[data-multi="EUR"] .mval    ==    25.7143 EUR

TC-MULTI-05 เลิกติดตามแล้วแถวหายไป
    [Tags]    TC-MULTI-05
    Open App And Wait For Live
    Star From List    JPY
    Get Element Count    ${MULTI_ROWS}    ==    1
    Star From List    JPY
    Get Element Count    ${MULTI_ROWS}    ==    0
