export const concepts = ["Separación","Inscripción","Mensualidad" ];

export const calculatePercent = async (patientData)=>{
    if(patientData.separationpaid == undefined){
        patientData.separationpaid = 0;
    }
    var sep = patientData.separationpaid ?? 0;
    patientData.sepationPercentage = sep / patientData.monthcost * 100;
    if (patientData.sepationPercentage >= 100) {
        patientData.sepationPercentage = 100;
    }

    //values.intromode 0: ya, 1: 50/50, 2: 3 meses diferidos
    let isDueIntro = false;
    patientData.intropaid = patientData.intropaid ?? 0;
    patientData.introamount = patientData.introcost ?? 0;
    patientData.introNextPayment = patientData.addedDate;
    if (patientData.introcost > 0 && patientData.intropaid < patientData.introcost) {
        
        isDueIntro = true;
        
        patientData.introNextPayment = patientData.addedDate;
        if ( patientData.intromode == 1){
            patientData.introamount = patientData.introcost / 2;
            // if has paid more than 50% of the intro cost, then the next payment is addedDate + 1 month
            if(patientData.intropaid >= patientData.introcost / 2){
                patientData.introNextPayment = patientData.addedDate?.plus({ months: 1 });
            }

        }
        if (patientData.intromode == 2){
            patientData.introamount = patientData.introcost / 3;
            // the first payment is the addedDate + 1 month
            //if paid 30 % of the intro cost, then the next payment is addedDate + 2 months
            // if paid 60% of the intro cost, then the next payment is addedDate + 3 months
            if(patientData.intropaid == 0){
                patientData.introNextPayment = patientData.addedDate?.plus({ months: 1 });
            }else if(patientData.intropaid >= patientData.introcost * 0.3){
                patientData.introNextPayment = patientData.addedDate?.plus({ months: 2 });
            }else if(patientData.intropaid >= patientData.introcost * 0.6){
                patientData.introNextPayment = patientData.addedDate?.plus({ months: 3 });
            }

        }

    }
    patientData.introcheck = isDueIntro;

    if(patientData.entrydate != undefined){
        patientData.fechapago = DateTime.fromISO(patientData.entrydate);//.startOf("month");
    }
    patientData.addedDate = DateTime.fromJSDate(patientData.added.toDate());
    if(patientData.newPaymentDate != undefined){
        patientData.addedDate = DateTime.fromISO(patientData.newPaymentDate);//.startOf("month");
    }

    let paymentsQS = await db.collection("recipt_payments").where("guestid", "==", patientData.id).get();
    let payments = [];
    paymentsQS.forEach((payment) => {
        payments.push(payment.data());
    });
    patientData.payments = payments;
    let tdini;        
    if (patientData.fechapago == undefined || patientData.addedDate > patientData.fechapago) {
        tdini = patientData.addedDate;//.startOf("month");
    } else {
        tdini = patientData.fechapago;//.startOf("month");
    }
    //add months to tdini until there is not a payment for that month
    let nextYear =DateTime.local().startOf("month").plus({ months: 12 });
    while (tdini < nextYear) {
        const monthId = tdini.startOf("month").toISODate();
        const hasMonth = patientData.payments.find((p) => {
            for (let i = 0; i < p.concepts.length; i++) {
                const c = p.concepts[i];
                if (c.concept === 2 && c.monthId === monthId) {
                    return true;
                }
            }
        });
        if (!hasMonth) {
            patientData.nextPayment = tdini;
            break;
        }
        tdini = tdini.plus({ months: 1 });
    }

    return patientData;
}