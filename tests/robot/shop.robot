*** Settings ***
Documentation     เทียบกับเรทร้านแลกเงิน/ธนาคาร (TC-SHOP-*) — 1,000 USD → THB เรทกลาง 35
Resource          resources/app.resource
Suite Setup       Start Test Environment
Suite Teardown    Stop Test Environment
Test Setup        Reset Mock
Test Teardown     Close Test Context
Force Tags        shop

*** Test Cases ***
TC-SHOP-01 ยังไม่กรอกเรท แสดงข้อความแนะนำ
    [Tags]    smoke    TC-SHOP-01
    Open App And Wait For Live
    Get Element States    id=shop-hint    contains    visible
    Get Element States    id=shop-out    contains    hidden

TC-SHOP-02 เรทร้านต่ำกว่าเรทกลาง
    [Tags]    smoke    TC-SHOP-02
    Open App And Wait For Live
    Fill Text    id=shop-rate    34
    Get Element States    id=shop-hint    contains    hidden
    Get Text    id=shop-market    ==    35,000 THB
    Get Text    id=shop-result    ==    34,000 THB
    Get Text    id=shop-diff    ==    -1,000 THB (-2.857%)
    Get Attribute    id=shop-diff    class    *=    down
    Get Text    id=shop-verdict    ==    ร้านให้น้อยกว่าเรทกลาง

TC-SHOP-03 หักค่าธรรมเนียมเป็นเปอร์เซ็นต์
    [Tags]    TC-SHOP-03
    Open App And Wait For Live
    Fill Text    id=shop-rate    34
    Fill Text    id=shop-fee-pct    1
    Get Text    id=shop-result    ==    33,660 THB
    Get Text    id=shop-diff    ==    -1,340 THB (-3.829%)

TC-SHOP-04 หักค่าธรรมเนียมคงที่ (หน่วยสกุลต้นทาง)
    [Tags]    TC-SHOP-04
    Open App And Wait For Live
    Fill Text    id=shop-rate    34
    Fill Text    id=shop-fee-fixed    5
    Get Text    id=shop-result    ==    33,830 THB
    Get Text    id=shop-diff    ==    -1,170 THB (-3.343%)

TC-SHOP-05 เรทร้านสูงกว่าเรทกลาง
    [Tags]    TC-SHOP-05
    Open App And Wait For Live
    Fill Text    id=shop-rate    36
    Get Text    id=shop-result    ==    36,000 THB
    Get Text    id=shop-diff    ==    +1,000 THB (+2.857%)
    Get Attribute    id=shop-diff    class    *=    up
    Get Text    id=shop-verdict    ==    ร้านให้มากกว่าเรทกลาง

TC-SHOP-06 เปลี่ยนจำนวนเงินแล้วผลเปลี่ยนตาม
    [Tags]    TC-SHOP-06
    Open App And Wait For Live
    Fill Text    id=shop-rate    34
    Fill Text    ${AMOUNT}    2
    Get Text    id=shop-market    ==    70 THB
    Get Text    id=shop-result    ==    68 THB
    Get Text    id=shop-diff    ==    -2 THB (-2.857%)

TC-SHOP-07 ป้ายกำกับตามคู่เงินที่เลือก
    [Tags]    TC-SHOP-07
    Open App And Wait For Live
    Get Text    id=shop-rate-label    *=    1 USD = ? THB
    Get Text    id=shop-fixed-label    *=    USD
    Select Options By    ${FROM}    value    EUR
    Get Text    id=shop-rate-label    *=    1 EUR = ? THB
    Get Text    id=shop-fixed-label    *=    EUR
