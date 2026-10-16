*** Settings ***
Documentation     สลับภาษา ไทย/อังกฤษ (TC-LANG-*)
Resource          resources/app.resource
Suite Setup       Start Test Environment
Suite Teardown    Stop Test Environment
Test Setup        Reset Mock
Test Teardown     Close Test Context
Force Tags        language

*** Test Cases ***
TC-LANG-01 ค่าเริ่มต้นเป็นภาษาไทย
    [Tags]    smoke    TC-LANG-01
    Open App And Wait For Live
    Get Attribute    css=html    lang    ==    th
    Get Text    css=h1    *=    เครื่องคำนวณค่าเงิน
    Get Attribute    css=[data-lang-set="th"]    aria-pressed    ==    true

TC-LANG-02 สลับเป็นภาษาอังกฤษ
    [Tags]    smoke    TC-LANG-02
    Open App And Wait For Live
    Choose Lang    en
    Get Attribute    css=html    lang    ==    en
    Get Text    css=h1    ==    💱 Currency Converter
    Get Text    css=label[for="amt"]    ==    Amount
    Get Text    ${REFRESH}    ==    Refresh
    Get Text    ${STATUS}    *=    ● Live
    Get Attribute    css=[data-lang-set="en"]    aria-pressed    ==    true

TC-LANG-03 จำภาษาที่เลือกหลังรีโหลด
    [Tags]    TC-LANG-03
    Open App And Wait For Live
    Choose Lang    en
    Reload
    Wait For Live Status
    Get Text    css=h1    ==    💱 Currency Converter
    Choose Lang    th
    Get Text    css=h1    *=    เครื่องคำนวณค่าเงิน

TC-LANG-04 ข้อความที่สร้างจากโปรแกรมเปลี่ยนเป็นอังกฤษด้วย
    [Tags]    TC-LANG-04
    Open App And Wait For Live
    Choose Lang    en
    Get Text    ${WATCH_EMPTY}    *=    No currencies are being watched yet
    Star From List    JPY
    Set Mock Rates    JPY=140
    Refresh And Wait
    Get Text    ${DELTA_LAST}    ==    ▲ Last +7.143%
    Get Text    ${DELTA_SINCE}    ==    ▲ Since watching +7.143%
    Get Text    ${MULTI_HEAD}    ==    From 1,000 USD

TC-LANG-05 ข้อความแจ้งเตือนราคาเป็นอังกฤษ
    [Tags]    TC-LANG-05
    Open App And Wait For Live
    Choose Lang    en
    Star From List    JPY
    Set Alert    JPY    above    0.24
    Set Mock Rates    JPY=140
    Refresh And Wait
    Get Text    ${TOASTS}    *=    JPY/THB above target 0.24 reached
    Get Text    ${ALERT_STATE}    *=    Target reached

TC-LANG-06 ชื่อสกุลเงินเปลี่ยนตามภาษา
    [Tags]    TC-LANG-06
    Open App And Wait For Live
    Fill Text    ${SEARCH}    jpy
    Get Text    ${ALL_ITEMS}    *=    เยน
    Choose Lang    en
    Get Text    ${ALL_ITEMS}    *=    Yen
    Choose Lang    th
    Get Text    ${ALL_ITEMS}    *=    เยน
