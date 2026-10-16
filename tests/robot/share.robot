*** Settings ***
Documentation     แชร์ลิงก์ผลลัพธ์ (TC-SHARE-*)
Resource          resources/app.resource
Suite Setup       Start Test Environment
Suite Teardown    Stop Test Environment
Test Setup        Reset Mock
Test Teardown     Close Test Context
Force Tags        share

*** Test Cases ***
TC-SHARE-01 กดแชร์แล้วแสดงลิงก์ของค่าปัจจุบัน
    [Tags]    smoke    TC-SHARE-01
    Open App And Wait For Live
    Get Element States    id=share-row    contains    hidden
    Click    id=share
    Get Element States    id=share-row    contains    visible
    Get Property    id=share-url    value    *=    ?amt=1000&from=USD&to=THB&lang=th

TC-SHARE-02 ลิงก์และแถบที่อยู่อัปเดตตามค่าที่เปลี่ยน
    [Tags]    TC-SHARE-02
    Open App And Wait For Live
    Fill Text    ${AMOUNT}    250
    Select Options By    ${FROM}    value    EUR
    Select Options By    ${TO}    value    JPY
    Get Url    *=    ?amt=250&from=EUR&to=JPY&lang=th
    Click    id=share
    Get Property    id=share-url    value    *=    ?amt=250&from=EUR&to=JPY&lang=th

TC-SHARE-03 เปิดลิงก์ที่แชร์แล้วได้ค่าตามลิงก์
    [Tags]    smoke    TC-SHARE-03
    Open App With Query    ?amt=250&from=EUR&to=JPY
    Get Property    ${AMOUNT}    value    ==    250
    Get Selected Options    ${FROM}    value    ==    EUR
    Get Selected Options    ${TO}    value    ==    JPY
    Result Should Be    41,666.67 JPY

TC-SHARE-04 พารามิเตอร์ที่ไม่ถูกต้องถูกข้าม ใช้ค่าเริ่มต้น
    [Tags]    TC-SHARE-04
    Open App With Query    ?amt=abc&from=ZZ&to=12&lang=fr
    Get Property    ${AMOUNT}    value    ==    1000
    Get Selected Options    ${FROM}    value    ==    USD
    Get Selected Options    ${TO}    value    ==    THB
    Result Should Be    35,000 THB
    Get Attribute    css=html    lang    ==    th

TC-SHARE-05 ลิงก์ที่ระบุ lang=en เปิดเป็นภาษาอังกฤษ
    [Tags]    TC-SHARE-05
    Open App With Query    ?lang=en
    Get Text    css=h1    ==    💱 Currency Converter
