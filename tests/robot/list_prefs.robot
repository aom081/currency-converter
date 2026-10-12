*** Settings ***
Documentation     รายการสกุลเงิน การค้นหา และการจำค่า (TC-LIST-*, TC-PREF-*)
Resource          resources/app.resource
Suite Setup       Start Test Environment
Suite Teardown    Stop Test Environment
Test Setup        Reset Mock
Test Teardown     Close Test Context
Force Tags        list

*** Test Cases ***
TC-LIST-01 แสดงสกุลเงินครบ 33 รายการ
    [Tags]    TC-LIST-01
    Open App And Wait For Live
    Get Element Count    ${ALL_ITEMS}    ==    33

TC-LIST-02 ค้นหาด้วยรหัส (ไม่สนตัวพิมพ์เล็กใหญ่)
    [Tags]    smoke    TC-LIST-02
    Open App And Wait For Live
    Fill Text    ${SEARCH}    jpy
    Get Element Count    ${ALL_ITEMS}    ==    1
    Get Text    ${ALL_ITEMS}    *=    JPY

TC-LIST-03 ค้นหาด้วยชื่อภาษาไทย
    [Tags]    TC-LIST-03
    Open App And Wait For Live
    Fill Text    ${SEARCH}    ยูโร
    Get Element Count    ${ALL_ITEMS}    ==    1
    Get Text    ${ALL_ITEMS}    *=    EUR

TC-LIST-04 ค้นหาแล้วไม่พบ
    [Tags]    TC-LIST-04
    Open App And Wait For Live
    Fill Text    ${SEARCH}    zzz
    Get Element Count    ${ALL_ITEMS}    ==    0
    Get Text    css=#all .empty    ==    ไม่พบสกุลเงิน

TC-PREF-01 จำสกุลที่เลือกไว้หลังรีโหลด
    [Tags]    TC-PREF-01
    Open App And Wait For Live
    Select Options By    ${FROM}    value    EUR
    Select Options By    ${TO}    value    GBP
    Select Options By    ${BASE}    value    USD
    Reload
    Wait For Live Status
    Get Selected Options    ${FROM}    value    ==    EUR
    Get Selected Options    ${TO}    value    ==    GBP
    Get Selected Options    ${BASE}    value    ==    USD
