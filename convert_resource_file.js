const XLSX = require("xlsx");

console.log("📄 컨설턴트 리소스 파일 변환 시작...\n");

try {
  // 원본 파일 읽기
  const workbook = XLSX.readFile("T_resorce.xlsx");
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  console.log(`✅ 원본 파일 읽기 완료: ${jsonData.length}개 행\n`);
  
  // 헤더 확인
  const headers = jsonData[0];
  const jobIndex = 0; // "직무"
  const statusIndex = 3; // "배정 가능 여부"
  
  console.log(`📋 헤더: ${JSON.stringify(headers)}\n`);
  
  // 직무별로 그룹핑 및 상태 집계
  const jobGroupMap = new Map();
  
  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row || row.length === 0) continue;
    
    const job = row[jobIndex] ? String(row[jobIndex]).trim() : "";
    const status = row[statusIndex] ? String(row[statusIndex]).trim() : "가능";
    
    if (!job) continue;
    
    if (!jobGroupMap.has(job)) {
      jobGroupMap.set(job, {
        가능: 0,
        불가: 0,
        조율: 0,
      });
    }
    
    const counts = jobGroupMap.get(job);
    if (status === "가능") counts.가능++;
    else if (status === "불가") counts.불가++;
    else if (status === "조율") counts.조율++;
  }
  
  console.log(`✅ ${jobGroupMap.size}개 직무 집계 완료\n`);
  
  // 집계 결과를 배열로 변환
  const aggregatedData = [];
  
  for (const [job, counts] of jobGroupMap.entries()) {
    // 상태 결정 로직: 가능한 컨설턴트가 있으면 "가능", 모두 불가면 "불가", 조율만 있으면 "조율"
    let overallStatus = "불가";
    if (counts.가능 > 0) {
      overallStatus = "가능";
    } else if (counts.조율 > 0) {
      overallStatus = "조율";
    }
    
    // 비고에 상세 정보 추가
    const note = `가능:${counts.가능}, 불가:${counts.불가}, 조율:${counts.조율}`;
    
    aggregatedData.push({
      "직군": job,
      "상태": overallStatus,
      "비고": note,
    });
    
    console.log(`   ${job}: ${overallStatus} (${note})`);
  }
  
  console.log(`\n📊 집계 완료: ${aggregatedData.length}개 직군\n`);
  
  // 새 워크북 생성
  const newWorkbook = XLSX.utils.book_new();
  const newWorksheet = XLSX.utils.json_to_sheet(aggregatedData, {
    header: ["직군", "상태", "비고"]
  });
  
  // 컬럼 너비 설정
  newWorksheet["!cols"] = [
    { wch: 20 }, // 직군
    { wch: 10 }, // 상태
    { wch: 30 }, // 비고
  ];
  
  XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, "컨설턴트리소스");
  
  // 파일 저장
  const outputFile = "T_resorce_upload_ready.xlsx";
  XLSX.writeFile(newWorkbook, outputFile);
  
  console.log(`✅ 변환된 파일 저장 완료: ${outputFile}`);
  console.log(`\n🎉 완료! 이제 어드민 페이지에서 "${outputFile}" 파일을 업로드하세요!`);
  console.log(`\n📋 파일 형식:`);
  console.log(`   - 직군: 직무명 (예: QA, DevOps, Backend 등)`);
  console.log(`   - 상태: 가능/불가/조율`);
  console.log(`   - 비고: 가능/불가/조율 인원 수`);
  
} catch (error) {
  console.error("❌ 오류 발생:", error.message);
  process.exit(1);
}





