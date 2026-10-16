*** Settings ***
Documentation     จัดเรียงรายการที่ติดตาม (TC-SORT-*)
Resource          resources/app.resource
Suite Setup       Start Test Environment
Suite Teardown    Stop Test Environment
Test Setup        Reset Mock
Test Teardown     Close Test Context
Force Tags        sort

*** Keywords ***
Open With Three Watched
    Open App And Wait For Live
    Star Jpy Eur Gbp

*** Test Cases ***
TC-SORT-01 ค่าเริ่มต้นเรียงตามที่เพิ่ม (กำหนดเอง)
    [Tags]    smoke    TC-SORT-01
    Open With Three Watched
    Get Selected Options    id=watch-sort    value    ==    manual
    Card Codes Should Be    JPY    EUR    GBP

TC-SORT-02 เลื่อนการ์ดขึ้น/ลงด้วยปุ่ม ▲▼
    [Tags]    TC-SORT-02
    Open With Three Watched
    Get Property    css=[data-move-up="JPY"]    disabled    ==    ${True}
    Get Property    css=[data-move-down="GBP"]    disabled    ==    ${True}
    Click    css=[data-move-down="JPY"]
    Card Codes Should Be    EUR    JPY    GBP
    Click    css=[data-move-up="GBP"]
    Card Codes Should Be    EUR    GBP    JPY

TC-SORT-03 เรียงตามรหัสสกุล A→Z
    [Tags]    TC-SORT-03
    Open With Three Watched
    Choose Sort    code
    Card Codes Should Be    EUR    GBP    JPY

TC-SORT-04 เรียงตามแข็งค่า/อ่อนค่ามากสุด
    [Tags]    smoke    TC-SORT-04
    Open With Three Watched
    Set Mock Rates    JPY=140    EUR=0.95
    Refresh And Wait
    Choose Sort    gain
    Card Codes Should Be    JPY    GBP    EUR
    Choose Sort    loss
    Card Codes Should Be    EUR    GBP    JPY

TC-SORT-05 จำโหมดเรียงและลำดับที่จัดเองหลังรีโหลด
    [Tags]    TC-SORT-05
    Open With Three Watched
    Click    css=[data-move-down="JPY"]
    Reload
    Wait For Live Status
    Card Codes Should Be    EUR    JPY    GBP
    Choose Sort    code
    Reload
    Wait For Live Status
    Get Selected Options    id=watch-sort    value    ==    code
    Card Codes Should Be    EUR    GBP    JPY

TC-SORT-06 ปุ่ม ▲▼ แสดงเฉพาะโหมดกำหนดเอง
    [Tags]    TC-SORT-06
    Open With Three Watched
    Get Element Count    css=[data-move-down]    ==    3
    Choose Sort    code
    Get Element Count    css=[data-move-down]    ==    0
    Choose Sort    manual
    Get Element Count    css=[data-move-down]    ==    3
