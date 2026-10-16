*** Settings ***
Documentation     สกุลเงินเพิ่มเติมจาก API (TC-CUR-*) — ทดสอบด้วย CZK ที่ไม่อยู่ในรายการหลัก 33 สกุล
Resource          resources/app.resource
Suite Setup       Start Test Environment
Suite Teardown    Stop Test Environment
Test Setup        Reset Mock
Test Teardown     Close Test Context
Force Tags        currencies

*** Test Cases ***
TC-CUR-01 สกุลที่ API ส่งมาเพิ่มขึ้นในรายการและค้นหาได้
    [Tags]    smoke    TC-CUR-01
    Set Mock Rates    CZK=22
    Open App And Wait For Live
    Get Element Count    ${ALL_ITEMS}    ==    34
    Fill Text    ${SEARCH}    czk
    Get Element Count    ${ALL_ITEMS}    ==    1
    Get Text    ${ALL_ITEMS}    *=    CZK

TC-CUR-02 เลือกสกุลเพิ่มเติมเป็นปลายทางแล้วคำนวณได้
    [Tags]    TC-CUR-02
    Set Mock Rates    CZK=22
    Open App And Wait For Live
    Select Options By    ${TO}    value    CZK
    Result Should Be    22,000 CZK

TC-CUR-03 ติดตามสกุลเพิ่มเติมได้
    [Tags]    TC-CUR-03
    Set Mock Rates    CZK=22
    Open App And Wait For Live
    Star From List    CZK
    Get Element Count    ${CARD}    ==    1
    Get Text    ${CARD_RATE}    *=    1.5909
