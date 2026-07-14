function getDb(rows){
    if(!rows){
        rows = [];
    }
    let docs = rows.map((val, idx)=>{
        return {id: val.id, data:()=>val
        };
    })

    let result = {
        size: rows.length,
        empty: rows.length == 0,
        docs: docs,
        forEach: (callback)=>{ docs.forEach(callback); }
    };

    return {
        //db: ()=>({
        collection:(node)=>({
          orderBy:()=>({
            onSnapshot:(callback)=>{ callback(result); }
          }),
          where:()=>({
            where:()=>({
              orderBy:()=>({
                onSnapshot:(callback)=>{ callback(result);},
                orderBy:()=>({
                  onSnapshot:(callback)=>{ callback(result);}
                })
              })
            })
          })
        })
        //})
      }
} 

let testAldoTickets = [
  {"uid":"pM6xuIggkxdHmzaN3n82","units":1,"created":{"seconds":1658506923,"nanoseconds":408000000},"type":0,"positions":"tXyo5BBNTpPWUytF8rd9","added":{"seconds":1671433200,"nanoseconds":251000000},"amount":500,"branch":"1XehtVCcczLB7NVZReJZ","createdBy":"pending","id":"QLFzp1zsqHRbPnGGRpfb","branchName":"Balsas","positionsName":"Encargado","detailName":""},
  {"branch":"A4JNT4BK8ScnTNhsF9XZ","createdBy":"9wdXrsyI07hd5t9i2bv0cX51rbc2","amount":200,"detail":1,"units":1,"createdName":"","type":0,"added":{"seconds":1671515999,"nanoseconds":999000000},"uid":"pM6xuIggkxdHmzaN3n82","id":"frrnIphy2Q7rDKff0mVV","branchName":"Lomas","detailName":"Ajuste de sueldo"},
  {"createdBy":"9wdXrsyI07hd5t9i2bv0cX51rbc2","uid":"pM6xuIggkxdHmzaN3n82","amount":-100,"type":1,"branch":"A4JNT4BK8ScnTNhsF9XZ","added":{"seconds":1671515999,"nanoseconds":999000000},"createdName":"","units":1,"detail":1,"id":"oPLBZOwk7YT6qUqdR1Cx","branchName":"Lomas","detailName":"Ajuste de sueldo"},
  {"createdBy":"9wdXrsyI07hd5t9i2bv0cX51rbc2","detail":2,"createdName":"","amount":-200,"uid":"pM6xuIggkxdHmzaN3n82","added":{"seconds":1671602399,"nanoseconds":999000000},"branch":"A4JNT4BK8ScnTNhsF9XZ","type":1,"units":1,"id":"HvchwwKPda2QJlmoxLpo","branchName":"Lomas","detailName":"Anticipo Nómina Tarjeta"},
  {"amount":150,"createdBy":"9wdXrsyI07hd5t9i2bv0cX51rbc2","units":1,"added":{"seconds":1671602399,"nanoseconds":999000000},"createdName":"","uid":"pM6xuIggkxdHmzaN3n82","branch":"A4JNT4BK8ScnTNhsF9XZ","detail":3,"type":1,"id":"QNXoCvchwVtFCHiPLTU9","branchName":"Lomas","detailName":"Bono"},
  {"branch":"A4JNT4BK8ScnTNhsF9XZ","amount":7500,"units":1,"created":{"seconds":1671562178,"nanoseconds":262000000},"added":{"seconds":1671606000,"nanoseconds":0},"positions":"tXyo5BBNTpPWUytF8rd9","createdBy":"pending","type":0,"uid":"pM6xuIggkxdHmzaN3n82","id":"c0jQe1StVO33udww5pgL","branchName":"Lomas","positionsName":"Encargado","detailName":""}
];

let testAldoMesTickets = [
  {"uid":"pM6xuIggkxdHmzaN3mes","units":1,"created":{"seconds":1658506923,"nanoseconds":408000000},"type":0,"positions":"tXyo5BBNTpPWUytF8rd9","added":{"seconds":1671433200,"nanoseconds":251000000},"amount":500,"branch":"1XehtVCcczLB7NVZReJZ","createdBy":"pending","id":"QLFzp1zsqHRbPnGGRpfb","branchName":"Balsas","positionsName":"Encargado","detailName":""},
  {"branch":"A4JNT4BK8ScnTNhsF9XZ","createdBy":"9wdXrsyI07hd5t9i2bv0cX51rbc2","amount":200,"detail":1,"units":1,"createdName":"","type":0,"added":{"seconds":1671515999,"nanoseconds":999000000},"uid":"pM6xuIggkxdHmzaN3mes","id":"frrnIphy2Q7rDKff0mVV","branchName":"Lomas","detailName":"Ajuste de sueldo"},
  {"createdBy":"9wdXrsyI07hd5t9i2bv0cX51rbc2","uid":"pM6xuIggkxdHmzaN3mes","amount":-100,"type":1,"branch":"A4JNT4BK8ScnTNhsF9XZ","added":{"seconds":1671515999,"nanoseconds":999000000},"createdName":"","units":1,"detail":1,"id":"oPLBZOwk7YT6qUqdR1Cx","branchName":"Lomas","detailName":"Ajuste de sueldo"},
  {"createdBy":"9wdXrsyI07hd5t9i2bv0cX51rbc2","detail":2,"createdName":"","amount":-200,"uid":"pM6xuIggkxdHmzaN3mes","added":{"seconds":1671602399,"nanoseconds":999000000},"branch":"A4JNT4BK8ScnTNhsF9XZ","type":1,"units":1,"id":"HvchwwKPda2QJlmoxLpo","branchName":"Lomas","detailName":"Anticipo Nómina Tarjeta"},
  {"amount":150,"createdBy":"9wdXrsyI07hd5t9i2bv0cX51rbc2","units":1,"added":{"seconds":1671602399,"nanoseconds":999000000},"createdName":"","uid":"pM6xuIggkxdHmzaN3mes","branch":"A4JNT4BK8ScnTNhsF9XZ","detail":3,"type":1,"id":"QNXoCvchwVtFCHiPLTU9","branchName":"Lomas","detailName":"Bono"},
  {"branch":"A4JNT4BK8ScnTNhsF9XZ","amount":7500,"units":1,"created":{"seconds":1671562178,"nanoseconds":262000000},"added":{"seconds":1671606000,"nanoseconds":0},"positions":"tXyo5BBNTpPWUytF8rd9","createdBy":"pending","type":0,"uid":"pM6xuIggkxdHmzaN3mes","id":"c0jQe1StVO33udww5pgL","branchName":"Lomas","positionsName":"Encargado","detailName":""}
];

let testAldoDobleUnidadTickets = [
  {"uid":"pM6xuIggkxdHmzaN3mes","units":1,"created":{"seconds":1658506923,"nanoseconds":408000000},"type":0,"positions":"tXyo5BBNTpPWUytF8rd9","added":{"seconds":1671433200,"nanoseconds":251000000},"amount":500,"branch":"1XehtVCcczLB7NVZReJZ","createdBy":"pending","id":"QLFzp1zsqHRbPnGGRpfb","branchName":"Balsas","positionsName":"Encargado","detailName":""},
  {"branch":"A4JNT4BK8ScnTNhsF9XZ","createdBy":"9wdXrsyI07hd5t9i2bv0cX51rbc2","amount":200,"detail":1,"units":1,"createdName":"","type":0,"added":{"seconds":1671515999,"nanoseconds":999000000},"uid":"pM6xuIggkxdHmzaN3mes","id":"frrnIphy2Q7rDKff0mVV","branchName":"Lomas","detailName":"Ajuste de sueldo"},
  {"createdBy":"9wdXrsyI07hd5t9i2bv0cX51rbc2","uid":"pM6xuIggkxdHmzaN3mes","amount":-100,"type":1,"branch":"A4JNT4BK8ScnTNhsF9XZ","added":{"seconds":1671515999,"nanoseconds":999000000},"createdName":"","units":1,"detail":1,"id":"oPLBZOwk7YT6qUqdR1Cx","branchName":"Lomas","detailName":"Ajuste de sueldo"},
  {"createdBy":"9wdXrsyI07hd5t9i2bv0cX51rbc2","detail":2,"createdName":"","amount":-200,"uid":"pM6xuIggkxdHmzaN3mes","added":{"seconds":1671602399,"nanoseconds":999000000},"branch":"A4JNT4BK8ScnTNhsF9XZ","type":1,"units":1,"id":"HvchwwKPda2QJlmoxLpo","branchName":"Lomas","detailName":"Anticipo Nómina Tarjeta"},
  {"amount":150,"createdBy":"9wdXrsyI07hd5t9i2bv0cX51rbc2","units":2,"added":{"seconds":1671602399,"nanoseconds":999000000},"createdName":"","uid":"pM6xuIggkxdHmzaN3mes","branch":"A4JNT4BK8ScnTNhsF9XZ","detail":3,"type":1,"id":"QNXoCvchwVtFCHiPLTU9","branchName":"Lomas","detailName":"Bono"},
  {"branch":"A4JNT4BK8ScnTNhsF9XZ","amount":7500,"units":1,"created":{"seconds":1671562178,"nanoseconds":262000000},"added":{"seconds":1671606000,"nanoseconds":0},"positions":"tXyo5BBNTpPWUytF8rd9","createdBy":"pending","type":0,"uid":"pM6xuIggkxdHmzaN3mes","id":"c0jQe1StVO33udww5pgL","branchName":"Lomas","positionsName":"Encargado","detailName":""}
];


export {getDb, testAldoTickets, testAldoMesTickets, testAldoDobleUnidadTickets};