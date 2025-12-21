const XLSX = require("xlsx");
const path = require("path");

// 원본 파일 경로
const inputFile = "2025_12_2week_cleaned_org.xlsx";
const outputFile = "2025_12_2week_upload_ready.xlsx";

console.log("📄 Excel 파일 정제 시작...\n");

// 파일 읽기
try {
  const workbook = XLSX.readFile(inputFile);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // JSON으로 변환 (헤더 포함)
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  console.log(`✅ 원본 파일 읽기 완료: ${data.length}개 행`);
  console.log(`📋 첫 번째 행 샘플:`);
  if (data.length > 0) {
    console.log(JSON.stringify(data[0], null, 2));
  }
  
  // 필요한 컬럼 형식으로 변환
  const cleanedData = data.map((row, index) => {
    const cleanRow = {};
    
    // 각 필드 매핑 (원본 컬럼명 → 정제된 컬럼명)
    const fieldMappings = [
      // 상태 (필수)
      { source: ["상태", "status"], target: "상태", required: true },
      // 날짜 (필수)
      { source: ["날짜", "결제일", "payment_date"], target: "결제일", required: true },
      // 환불일 (선택)
      { source: ["환불일", "refund_date"], target: "환불일", required: false },
      // 판매자 (필수)
      { source: ["판매자", "seller", "판매자명"], target: "판매자", required: true },
      // 구매자 (필수)
      { source: ["구매자", "buyer", "구매자명"], target: "구매자", required: true },
      // 판매구분 (필수)
      { source: ["판매구분", "sales_type", "구분"], target: "판매구분", required: true },
      // 상품명 (필수)
      { source: ["상품", "상품명", "product_name", "프로그램", "수강상품", "판매상품"], target: "상품명", required: true },
      // 결제금액 (필수)
      { source: ["결제금액", "결제매출", "payment_amount"], target: "결제금액", required: true },
      // 환불금액 (선택)
      { source: ["환불금액", "refund_amount"], target: "환불금액", required: false },
      // 환불사유 (선택)
      { source: ["환불사유", "refund_reason"], target: "환불사유", required: false },
      // 선택 필드들
      { source: ["정가", "상품정가", "list_price"], target: "정가", required: false },
      { source: ["주문금액", "order_amount"], target: "주문금액", required: false },
      { source: ["포인트", "points"], target: "포인트", required: false },
      { source: ["쿠폰", "coupon"], target: "쿠폰", required: false },
      { source: ["구분코드", "category_code"], target: "구분코드", required: false },
      { source: ["매출코드", "product_code"], target: "매출코드", required: false },
    ];
    
    // 각 필드 매핑 적용
    for (const mapping of fieldMappings) {
      let value = null;
      
      // source 배열에서 하나라도 존재하는 컬럼 찾기
      for (const sourceKey of mapping.source) {
        if (row[sourceKey] !== undefined && row[sourceKey] !== null && row[sourceKey] !== "") {
          value = row[sourceKey];
          break;
        }
      }
      
      // 필수 필드 체크
      if (mapping.required && (value === null || value === undefined || value === "")) {
        console.warn(`⚠️  행 ${index + 2}: 필수 필드 "${mapping.target}"가 비어있습니다.`);
      }
      
      cleanRow[mapping.target] = value || "";
    }
    
    return cleanRow;
  });
  
  console.log(`\n✅ 데이터 정제 완료: ${cleanedData.length}개 행`);
  console.log(`📋 정제된 첫 번째 행 샘플:`);
  if (cleanedData.length > 0) {
    console.log(JSON.stringify(cleanedData[0], null, 2));
  }
  
  // 정제된 컬럼 순서
  const columnOrder = [
    "상태",
    "결제일",
    "환불일",
    "판매자",
    "구매자",
    "판매구분",
    "상품명",
    "정가",
    "주문금액",
    "결제금액",
    "환불금액",
    "환불사유",
    "포인트",
    "쿠폰",
    "구분코드",
    "매출코드",
  ];
  
  // 새 워크북 생성
  const newWorkbook = XLSX.utils.book_new();
  const newWorksheet = XLSX.utils.json_to_sheet(cleanedData, { header: columnOrder });
  
  // 컬럼 너비 설정
  const colWidths = columnOrder.map(col => ({ wch: 15 }));
  newWorksheet["!cols"] = colWidths;
  
  // 워크북에 시트 추가
  XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, "매출데이터");
  
  // 파일 저장
  XLSX.writeFile(newWorkbook, outputFile);
  
  console.log(`\n✅ 정제된 파일 저장 완료: ${outputFile}`);
  console.log(`\n📊 통계:`);
  console.log(`   - 전체 행: ${cleanedData.length}개`);
  
  // 상태별 통계
  const statusCount = cleanedData.reduce((acc, row) => {
    const status = row["상태"];
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  
  console.log(`   - 상태별:`);
  for (const [status, count] of Object.entries(statusCount)) {
    console.log(`     - ${status}: ${count}건`);
  }
  
  console.log(`\n🎉 완료! 이제 어드민 페이지에서 "${outputFile}" 파일을 업로드하세요!`);
  
} catch (error) {
  console.error("❌ 오류 발생:", error.message);
  process.exit(1);
}

