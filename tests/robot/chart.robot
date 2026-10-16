*** Settings ***
Documentation     กราฟย้อนหลัง (TC-CHART-*)
Resource          resources/app.resource
Suite Setup       Start Test Environment
Suite Teardown    Stop Test Environment
Test Setup        Reset Mock
Test Teardown     Close Test Context
Force Tags        chart

*** Test Cases ***
TC-CHART-01 แสดงกราฟเริ่มต้น 30 วันของ USD → THB
    [Tags]    smoke    TC-CHART-01
    Open App And Wait For Live
    Get Text    ${CHART_TITLE}    ==    USD → THB
    Get Attribute    css=#chart-range [data-range="30"]    aria-pressed    ==    true
    Get Attribute    ${CHART_SVG}    data-points    ==    31
    Get Text    id=st-latest    ==    35
    Get Text    id=st-min    ==    31.5
    Get Text    id=st-max    ==    35
    Get Text    id=st-chg    ==    +11.111%

TC-CHART-02 สลับช่วง 7 / 90 วัน
    [Tags]    TC-CHART-02
    Open App And Wait For Live
    Select Range    7
    Get Attribute    ${CHART_SVG}    data-points    ==    8
    Select Range    90
    Get Attribute    ${CHART_SVG}    data-points    ==    91
    Get Attribute    css=#chart-range [data-range="7"]    aria-pressed    ==    false

TC-CHART-03 เปลี่ยนคู่เงินในตัวแปลง กราฟเปลี่ยนตาม
    [Tags]    TC-CHART-03
    Open App And Wait For Live
    Select Options By    ${TO}    value    JPY
    Get Text    ${CHART_TITLE}    ==    USD → JPY
    Get Text    id=st-latest    ==    150
    Get Text    id=st-min    ==    135

TC-CHART-04 สกุลต้นทางและปลายทางเหมือนกัน
    [Tags]    TC-CHART-04
    Open App And Wait For Live
    Select Options By    ${TO}    value    USD
    Get Text    ${CHART_MSG}    *=    เลือกสองสกุลที่ต่างกัน
    Get Element Count    ${CHART_SVG}    ==    0

TC-CHART-05 ผู้ให้บริการไม่มีข้อมูลย้อนหลังของสกุลนั้น
    [Tags]    TC-CHART-05
    Open App And Wait For Live
    Select Options By    ${TO}    value    VND
    Get Text    ${CHART_MSG}    *=    ไม่มีข้อมูลย้อนหลัง
    Get Element Count    ${CHART_SVG}    ==    0

TC-CHART-06 โหลดข้อมูลย้อนหลังไม่ได้ ไม่กระทบตัวแปลงหลัก
    [Documentation]    mock ของ Robot ล่มทั้งสอง endpoint พร้อมกัน จึงเช็กว่าตัวแปลงยังใช้ข้อมูลสำรองได้
    [Tags]    TC-CHART-06
    Set Mock Failure    True
    Open App
    Wait For Offline Status
    Get Text    ${CHART_MSG}    *=    ไม่มีข้อมูลย้อนหลัง
    Result Should Be    33,500 THB
