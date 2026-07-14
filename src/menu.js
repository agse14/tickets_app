import {wrap} from 'svelte-spa-router/wrap'
import Home from './pages/Home.svelte'
import NotFound from './pages/NotFound.svelte'
import BranchesList from './pages/BranchesList.svelte'
import BranchesEdit from './pages/BranchesEdit.svelte'
import BirthdayList from './pages/BirthdayList.svelte'
import WorkersList from './pages/WorkersList.svelte'
import WorkersListInactive from './pages/WorkersListInactive.svelte'
import WorkersEdit from './pages/WorkersEdit.svelte'
import ProductsList from './pages/ProductsList.svelte'
import ProductsEdit from './pages/ProductsEdit.svelte'
import PositionsList from './pages/PositionsList.svelte'
import PositionsEdit from './pages/PositionsEdit.svelte'
import UsersList from './pages/UsersList.svelte'
import UsersEdit from './pages/UsersEdit.svelte'
import InventoryList from './pages/InventoryList.svelte'
import InventoryEdit from './pages/InventoryEdit.svelte'
import WorkrolesList from './pages/WorkrolesList.svelte'
import WorkrolesEdit from './pages/WorkrolesEdit.svelte'
import PartnersList from './pages/PartnersList.svelte'
import PartnersEdit from './pages/PartnersEdit.svelte'
import MonthlyPayments from './pages/MonthlyPayments.svelte'
import PartnersWebList from './pages/PartnersWebList.svelte'
import PartnersWebEdit from './pages/PartnersWebEdit.svelte'
import PersonalList from './pages/PersonalList.svelte'
import PersonalEdit from './pages/PersonalEdit.svelte'
import PatientsList from './pages/PatientsList.svelte'
import PatientsEdit from './pages/PatientsEdit.svelte'
import MomentsEdit from './pages/MomentsEdit.svelte'
import MomentsList from './pages/MomentsList.svelte'
import NewsList from './pages/NewsList.svelte'
import NewsEdit from './pages/NewsEdit.svelte'
import PaymentsList from './pages/PaymentsList.svelte'
import PaymentsEdit from './pages/PaymentsEdit.svelte'
import CaptureInventory from './pages/CaptureInventory.svelte'
import ProductordersList from './pages/ProductordersList.svelte'
import Login from './Login.svelte'
import ComponentTest from './pages/ComponentTest.svelte'
import Schedule from './pages/Schedule.svelte'
import BranchSchedule from './pages/BranchSchedule.svelte'
import PastInventoryList from './pages/PastInventoryList.svelte'
import PastInventoryEdit from './pages/PastInventoryEdit.svelte'
import ScheduleDisplay from './pages/ScheduleDisplay.svelte'
import PartnercontactList from './pages/PartnercontactList.svelte'

import ClientsList from './pages/ClientsList.svelte'
import ClientsEdit from './pages/ClientsEdit.svelte'
import ServicesList from './pages/ServicesList.svelte'
import ServicesEdit from './pages/ServicesEdit.svelte'

import VacationsList from './pages/VacationsList.svelte'
import VacationsEdit from './pages/VacationsEdit.svelte'

import WorkpayList from './pages/WorkpayList.svelte'
import WorkpayEdit from './pages/WorkpayEdit.svelte'

import WorkabsencesList from './pages/WorkabsencesList.svelte'
import WorkabsencesEdit from './pages/WorkabsencesEdit.svelte'

import JobsList from './pages/JobsList.svelte'
import JobsEdit from './pages/JobsEdit.svelte'


import EquipmentList from './pages/EquipmentList.svelte'
import EquipmentEdit from './pages/EquipmentEdit.svelte'

import EquipmentsalesList from './pages/EquipmentsalesList.svelte'
import EquipmentsalesEdit from './pages/EquipmentsalesEdit.svelte'

import FormListInterface from './pages/FormListInterface.svelte'
import FormFieldsInterface from './pages/FormFieldsInterface.svelte'

import DischargeLetter from './pages/DischargeLetter.svelte'
import Clinic_historyList from './pages/Clinic_historyList.svelte'
import Clinic_historyEdit from './pages/Clinic_historyEdit.svelte'

import Medication_cardList from './pages/Medication_cardList.svelte'
import Medication_cardEdit from './pages/Medication_cardEdit.svelte'

import Guest_cardList from './pages/Guest_cardList.svelte'
import Guest_cardEdit from './pages/Guest_cardEdit.svelte'

import NewGuestPayments from './pages/NewGuestPayments.tw.svelte'
import Guest_paymentsList from './pages/Guest_paymentsList.svelte'
import Guest_paymentsEdit from './pages/Guest_paymentsEdit.svelte'
import NewGuestPaymentsEdit from './pages/NewGuestPaymentsEdit.tw.svelte'
import NewGuestPaymentsRecipt from './pages/NewGuestPaymentsRecipt.tw.svelte'

import Guest_paymentsAdd from './pages/Guest_paymentsAdd.svelte'

import Guest_monthpayments from './pages/Guest_monthpayments.svelte'
import Guest_viewPaymentshistory from './pages/Guest_viewPaymentshistory.svelte'
import NewGuest_viewPaymentshistory from './pages/NewGuest_viewPaymentshistory.svelte'
import NewGuestPaymentStatus from './pages/NewGuestPaymentStatus.svelte'
import NewGuestPaymentDeliver from './pages/NewGuestPaymentDeliver.svelte'

import Select from './controls/VisualScale.svelte'

import NurseryList from './pages/NurseryList.svelte'
import NurseryEdit from './pages/NurseryEdit.svelte'
import NurseryReport from './pages/NurseryReport.svelte'

import formato from './pages/Formato.svelte'
import formato1 from './pages/Formato1.svelte'
import formato2 from './pages/Formato2.svelte'
import formato3 from './pages/Formato3.svelte'

import Update from './pages/Update.svelte'
import DocumentsList from './pages/Documents.svelte'

import TicketsList from './pages/TicketsList.svelte'
import TicketsEdit from './pages/TicketsEdit.svelte'
import TicketsHistory from './pages/TicketsHistory.svelte'
import TicketsKanban from './pages/TicketsKanban.svelte'
import TicketsSistemasSoporte from './pages/TicketsSistemasSoporte.svelte'
import Tickets from './pages/Tickets.svelte'
import TicketsFilterAdmin from './pages/TicketsFilterAdmin.svelte'
import TicketsClosed from './pages/TicketsClosed.svelte'
import TicketsAssigned from './pages/TicketsAssigned.svelte'
import IncidentsRH from './pages/IncidentsRH.svelte'
import SprintBoard from './pages/SprintBoard.svelte'
import SprintsList from './pages/SprintsList.svelte'
import SprintEdit from './pages/SprintEdit.svelte'
// import Backups from './pages/Backups.svelte'

//import InventoryReport from './reports/InventoryReport.svelte')

export const routes = {
    // //NotifyAdmin
    '/retest': Select,
    // Exact path
    '/': Home,
    '/update': Update,
    '/documents': DocumentsList,
    // '/backups': Backups,
    '/branches': BranchesList,
    '/birthdays': BirthdayList,
    '/workers': WorkersList,
    '/workersinactive': WorkersListInactive,
    '/addbranches': BranchesEdit,
    '/editbranches/:bid': BranchesEdit,
    '/addworkers': WorkersEdit,
    '/editworkers/:bid': WorkersEdit,
    '/positions': PositionsList,
    '/addpositions': PositionsEdit,
    '/editpositions/:bid': PositionsEdit,
    '/products': ProductsList,
    '/addproducts': ProductsEdit,
    '/editproducts/:bid': ProductsEdit,
    '/users': UsersList,
    '/addusers': UsersEdit,
    '/editusers/:bid': UsersEdit,
    '/inventory/:field/:value': wrap({
        component: InventoryList,
        props: {loadDataTable: true}
    }),//InventoryList,
    '/addinventory/:field/:value': InventoryEdit,
    '/editinventory/:bid': InventoryEdit,
    '/workroles/:field/:value': WorkrolesList,
    '/addworkroles/:field/:value': WorkrolesEdit,
    '/editworkroles/:bid': WorkrolesEdit,
    '/partners':  wrap({component: PartnersList,
        props: {modal: false}}),
    '/addpartners': PartnersEdit,
    '/editpartners/:bid': PartnersEdit,
    '/partnersweb': PartnersWebList,
    '/addpartnersweb': PartnersWebEdit,
    '/editpartnersweb/:bid': PartnersWebEdit,
    '/personal': PersonalList,
    '/addpersonal': PersonalEdit,
    '/editpersonal/:bid': PersonalEdit,
    '/moments': MomentsList,
    '/addmoments': MomentsEdit,
    '/editmoments/:bid': MomentsEdit,
    '/news': NewsList,
    '/addnews': NewsEdit,
    '/editnews/:bid': NewsEdit,
    '/pages/NurseryList': NurseryList,
    '/pages/NurseryReport': NurseryReport,
    '/patients': wrap({component: PatientsList,
        props: {modal: false, profileFilter:['branch','branches']}}),
    '/addpatients': PatientsEdit,
    '/addpatients/:field/:value': PatientsEdit,
    '/editpatients/:bid': PatientsEdit,
    '/editpatients/:bid/Formato': formato,
    '/editpatients/:bid/Formato1': formato1,
    '/editpatients/:bid/Formato2': formato2,
    '/editpatients/:bid/Formato3': formato3,
    '/editpatients/:bid/:field/:value': PatientsEdit,
    '/payments': PaymentsList,
    '/editpayments/:bid': PaymentsEdit,
    '/captureinventory/:field/:value': CaptureInventory,
    '/captureinventory': CaptureInventory,
    '/productorders': wrap({
        component: ProductordersList,
       // props: {productType: 0}
    }),
    '/cleanorders': wrap({
        component: ProductordersList,
        props: {productType: 1}
    }),
    '/inventoryhistory': PastInventoryList,
    '/editpastinventory/:bid': PastInventoryEdit,
    '/login': Login,
    // '/test': ComponentTest,
    '/schedules': Schedule,
    '/branch/:bid': BranchSchedule,
    '/scheduledisplay': ScheduleDisplay,
    '/partnercontact': PartnercontactList,
    
    '/services': ServicesList,
    '/editservices/:bid': ServicesEdit,
    '/clients': ClientsList,
    '/addclients': ClientsEdit,
    '/editclients/:bid': ClientsEdit,

    '/vacations': VacationsList,
    '/addvacations': VacationsEdit,
    '/editvacations/:bid': VacationsEdit,

    '/workpay': WorkpayList,
    '/editworkpay/:bid': WorkpayEdit,
    '/workabsences': WorkabsencesList,
    '/editworkabsences/:bid': WorkabsencesEdit,

    '/jobs': JobsList,
    '/editjobs/:bid': JobsEdit,
    '/jobs_report':  wrap({
        asyncComponent: () => import('./pages/JobsReport.svelte')
    }),

    '/equipment': EquipmentList,
    '/addequipment': EquipmentEdit,
    '/editequipment/:bid': EquipmentEdit,
    '/equipmentsales': EquipmentsalesList,
    '/addequipmentsales': EquipmentsalesEdit,
    '/editequipmentsales/:bid': EquipmentsalesEdit,

     //forminterface
     '/formlistinterface': FormListInterface,
     '/formlistinterface/:node': FormListInterface,
     '/formfieldsinterface/:node': FormFieldsInterface,
     '/formfieldsinterface/:node/:fid': FormFieldsInterface,

     // Carta Alta
 
     '/clinic_history': Clinic_historyList,
     '/addclinic_history':  Clinic_historyEdit,
     '/editclinic_history/:bid':  Clinic_historyEdit,
     '/dischargeletter/:bid': DischargeLetter,

     '/medication_card': Medication_cardList,
     '/addmedication_card': Medication_cardEdit,
     '/editmedication_card/:bid':  Medication_cardEdit,

     '/guest_card': Guest_cardList,
     '/addguest_card': Guest_cardEdit,
     '/editguest_card/:bid':  Guest_cardEdit,

     '/guest_payments': Guest_paymentsList,
     '/patient_payments': NewGuestPayments,
     '/addguest_payments': Guest_paymentsEdit,
     '/addnew_payments/:pid': NewGuestPaymentsEdit,
     '/recipt_payments/:pid': NewGuestPaymentsRecipt,
     '/viewguest_payments/:pid': Guest_paymentsEdit,
     '/addguest_payment/:bid': Guest_paymentsEdit,
     '/addguest_payments/:bid/intro/:amount': Guest_paymentsEdit,
     '/addguest_payments/:bid/:pids/': Guest_paymentsEdit,
     '/addguest_payments/:bid/:pids/intro/:amount': Guest_paymentsEdit,
     '/addguest_payments/:bid':  Guest_paymentsAdd,
     '/guest_monthpayments': Guest_monthpayments,
     '/guest_paymentshistory/:bid': Guest_viewPaymentshistory,
     '/newguest_paymentshistory/:bid': NewGuest_viewPaymentshistory,
     '/payments_status':NewGuestPaymentStatus,
     '/payments_deliver':NewGuestPaymentDeliver,
     '/payments': MonthlyPayments,
     //Prescriptions
     '/prescriptions/:field/:value':  wrap({ 
        asyncComponent: () => import('./pages/PrescriptionsList.svelte')
    }),
    //Prescriptions
    '/prescriptionslow/:field/:value':  wrap({ 
        asyncComponent: () => import('./pages/PrescriptionsLowList.svelte')
    }),
     '/addprescriptions/:field/:value':  wrap({
        asyncComponent: () => import('./pages/PrescriptionsEdit.svelte')
    }),
     '/editprescriptions/:bid':  wrap({
        asyncComponent: () => import('./pages/PrescriptionsEdit.svelte')
    }),

    //prescriptions_history
    '/prescriptions_stock':  wrap({ 
        asyncComponent: () => import('./pages/PrescriptionsStock.svelte'),
        props: {hasEdit:false, hasAdd:false, profileFilter:['branch','branches']}
    }),
    '/prescriptions_history/:field/:value':  wrap({ 
        asyncComponent: () => import('./pages/Prescriptions_historyList.svelte'),
        props: {hasEdit:false, hasAdd:false}
    }),
    '/prescriptions_report/:field/:value':  wrap({ 
        asyncComponent: () => import('./pages/PrescriptionsReport.svelte'),
        props: {hasEdit:false, hasAdd:false}
    }),
     '/addprescriptions_history/:field/:value':  wrap({
        asyncComponent: () => import('./pages/Prescriptions_historyEdit.svelte')
    }),
     '/editprescriptions_history/:bid':  wrap({
        asyncComponent: () => import('./pages/Prescriptions_historyEdit.svelte')
    }),

    //Drug_inventory
    '/drug_inventory/:field/:value':  wrap({ 
        asyncComponent: () => import('./pages/Drug_inventoryList.svelte')
    }),
     '/adddrug_inventory/:field/:value':  wrap({
        asyncComponent: () => import('./pages/Drug_inventoryEdit.svelte')
    }),
     '/editdrug_inventory/:bid':  wrap({
        asyncComponent: () => import('./pages/Drug_inventoryEdit.svelte')
    }),

    //Payment log
    '/patientlog':  wrap({
        asyncComponent: () => import('./pages/PatientlogList.svelte')
    }),
     '/addpatientlog':  wrap({
        asyncComponent: () => import('./pages/PatientlogEdit.svelte')
    }),
     '/editpatientlog/:bid':  wrap({
        asyncComponent: () => import('./pages/PatientlogEdit.svelte')
    }),
    
     //Rooms
    '/room_inventory/:field/:value':  wrap({
        asyncComponent: () => import('./pages/Room_inventoryList.svelte')
    }),
    '/addroom_inventory/:field/:value':  wrap({
        asyncComponent: () => import('./pages/Room_inventoryEdit.svelte')
    }),
    '/editroom_inventory/:bid':  wrap({
        asyncComponent: () => import('./pages/Room_inventoryEdit.svelte')
    }),

    //Activities
    '/activities':  wrap({
        asyncComponent: () => import('./pages/ActivitiesList.svelte'),
        props: { profileFilter:['branch','branches']}
    }),
    '/addactivities/:field/:value':  wrap({
        asyncComponent: () => import('./pages/ActivitiesEdit.svelte')
    }),
    '/editactivities/:bid':  wrap({
        asyncComponent: () => import('./pages/ActivitiesEdit.svelte')
    }),

    '/cardActivities':  wrap({
        asyncComponent: () => import('./pages/CardactivitiesList.svelte')
    }),
    '/addcardActivities/:field/:value':  wrap({
        asyncComponent: () => import('./pages/CardactivitiesEdit.svelte')
    }),
    '/editcardActivities/:bid':  wrap({
        asyncComponent: () => import('./pages/CardactivitiesEdit.svelte')
    }),
    '/card/:bid':  wrap({
        asyncComponent: () => import('./pages/CardDisplay.svelte')
    }),
    '/card':  wrap({
        asyncComponent: () => import('./pages/CardDisplay.svelte')
    }),
    '/cardclose':  wrap({
        asyncComponent: () => import('./pages/CardGroupClose.svelte')
    }),
    '/cardgroup/:bid':  wrap({
        asyncComponent: () => import('./pages/CardGroupDisplay.svelte'),
        props:{menu:false}
    }),
    '/cardresponsable/:bid':  wrap({
        asyncComponent: () => import('./pages/CardGroupResponsable.svelte')
    }),

    //Nurwsey  :  /:field/:value
    '/nursery':  wrap({
        asyncComponent: () => import('./pages/NurseReport.svelte')
        
    }),
    '/nursery_day':  wrap({
        asyncComponent: () => import('./pages/NurseDayReport.svelte')
        
    }),
    '/nursery/:field/:value':  wrap({
        asyncComponent: () => import('./pages/NurseryList.svelte')
        
    }),
    '/addnursery/:field/:value':  wrap({
        asyncComponent: () => import('./pages/NurseryEdit.svelte')
    }),
    '/addnursery/:field/:value/*':  wrap({
        asyncComponent: () => import('./pages/NurseryEdit.svelte')
    }),
    '/editnursery/:bid':  wrap({
        asyncComponent: () => import('./pages/NurseryEdit.svelte')
    }),
    '/nurseryreport/:bid':  wrap({
        asyncComponent: () => import('./pages/NurseryReport.svelte'),
        props:{menu:false}
    }),
    '/nursery_print/:bid/:dayId':  wrap({
        asyncComponent: () => import('./pages/NurseryReport.svelte'),
        props:{menu:false}
    }),
    

    //Supervision
    '/supervision':  wrap({
        asyncComponent: () => import('./pages/SupervisionList.svelte'),
        props: {modal: false}
    }),
    '/supervision_estancia':  wrap({
        asyncComponent: () => import('./pages/SupervisionListBranch.svelte'),
        props: {modal: false}
    }),
    '/supervision_report':  wrap({
        asyncComponent: () => import('./pages/SupervisionReportNew.tw.svelte'),
        props: {modal: false}
    }),
    '/addsupervision':  wrap({
        asyncComponent: () => import('./pages/SupervisionEdit.svelte'),
        props: {buttons: false}
        
    }),
    '/addsupervision/:field/:value':  wrap({
        asyncComponent: () => import('./pages/SupervisionEdit.svelte'),
        props: {buttons: false}
    }),
    '/addsupervision/:field/:value/*':  wrap({
        asyncComponent: () => import('./pages/SupervisionEdit.svelte'),
        props: {buttons: false}
    }),
    '/editsupervision/:bid':  wrap({
        asyncComponent: () => import('./pages/SupervisionEdit.svelte'),
        props: {buttons: false}
    }),
    '/incidents':  wrap({
        asyncComponent: () => import('./pages/IncidentList.svelte')
    }),
    '/addincident/:tid':  wrap({
        asyncComponent: () => import('./pages/IncidentEdit.svelte')
        
    }),
    '/editincident/:bid':  wrap({
        asyncComponent: () => import('./pages/IncidentEdit.svelte')
        
    }),
    '/supervision_qr/:bid':  wrap({
        asyncComponent: () => import('./pages/SupervisionQR.svelte')
        
    }),

    '/supervision_obs':  wrap({
        asyncComponent: () => import('./pages/Supervision_obsList.svelte'),
    }),
    '/maintenance':  wrap({
        asyncComponent: () => import('./pages/MaintenanceList.svelte'),
    }),
    '/minute':  wrap({
        asyncComponent: () => import('./pages/MinuteList.svelte'),
    }),
    '/addsupervision_obs':  wrap({
        asyncComponent: () => import('./pages/Supervision_obsEdit.svelte'),
        
    }),
    '/editsupervision_obs/:bid':  wrap({
        asyncComponent: () => import('./pages/Supervision_obsEdit.svelte'),
    }),

    '/supervision_tags':  wrap({
        asyncComponent: () => import('./pages/Supervision_tagsList.svelte'),
    }),
    '/supervisionReader':  wrap({
        asyncComponent: () => import('./pages/SupervisionReader.svelte'),
    }),
    '/supervision_ids':  wrap({
        asyncComponent: () => import('./pages/SupervisionIds.svelte'),
    }),
    '/addsupervision_tags':  wrap({
        asyncComponent: () => import('./pages/Supervision_tagsEdit.svelte'),
        
    }),
    '/editsupervision_tags/:bid':  wrap({
        asyncComponent: () => import('./pages/Supervision_tagsEdit.svelte'),
    }),

    '/supervision_tags_check':  wrap({
        asyncComponent: () => import('./pages/Supervision_tags_checkList.svelte'),
    }),
    '/supervision_tags_report':  wrap({
        asyncComponent: () => import('./pages/Supervision_tags_checkReport.svelte'),
    }),
    '/supervision_day_report':  wrap({
        asyncComponent: () => import('./pages/Supervision_day_Report.svelte'),
    }),
    '/activities_rating_report':  wrap({
        asyncComponent: () => import('./pages/Activities_Rating_Report.svelte'),
        props: {modal: false}
    }),
    '/workers_rating_report':  wrap({
        asyncComponent: () => import('./pages/Workers_Rating_Report.svelte'),
        props: {modal: false}
    }),
    '/workers_rating_report_new':  wrap({
        asyncComponent: () => import('./pages/Workers_Rating_Report2.svelte'),
        // asyncComponent: () => import('./pages/Workers_Rating_Report_Simple.svelte'),
        props: {modal: false}
    }),
    '/workers_rating_history':  wrap({
        asyncComponent: () => import('./pages/Workers_Rating_History.svelte'),
        props: {modal: false}
    }),

    //Reports
    '/reports/inventorypurchases':  wrap({
        asyncComponent: () => import('./reports/InventoryReport.svelte')
    }),
    '/reports/salary':  wrap({
        asyncComponent: () => import('./reports/salaryReport.svelte')
    }),
    '/reports/cash_flow':  wrap({
        asyncComponent: () => import('./reports/CashReport.svelte')
    }),
    '/pages/tickets':  wrap({
        asyncComponent: () => import('./pages/Tickets.svelte')
    }),
    '/pages/tickets2':  wrap({
        asyncComponent: () => import('./pages/Tickets2.svelte')
    }),
    '/pages/requisition':  wrap({
        asyncComponent: () => import('./pages/Requisition.svelte')
    }),
    '/pages/assistance':  wrap({
        asyncComponent: () => import('./pages/Assistance.svelte')
    }),
    '/notifyadmin':  wrap({
        asyncComponent: () => import('./pages/notifyAdmin.svelte')
    }),

    '/tickets': TicketsList,
    '/tickets-assigned': TicketsAssigned,
    '/tickets-sistemas-soporte': TicketsSistemasSoporte,
    // '/tickets-kanban': () => import('./pages/TicketsKanban.svelte'),
    '/addtickets': TicketsEdit,
    '/ticketsedit/:bid': TicketsEdit,
    '/ticketshistory': TicketsHistory,
    '/tickets-kanban': TicketsKanban,
    '/tickets-support' : TicketsSistemasSoporte,
    '/tickets-filter-admin': TicketsFilterAdmin,
    '/tickets-cerrados': TicketsClosed,
    '/incidents-rh': IncidentsRH,

    // Tickets por área asignada
    '/tickets-sistemas': wrap({ component: TicketsList, props: { params: { field: 'area', value: 0 } } }),
    '/tickets-administrativo': wrap({ component: TicketsList, props: { params: { field: 'area', value: 1 } } }),
    '/tickets-recursos-humanos': wrap({ component: TicketsList, props: { params: { field: 'area', value: 2 } } }),
    '/tickets-mantenimiento': wrap({ component: TicketsList, props: { params: { field: 'area', value: 3 } } }),
    '/tickets-comercial': wrap({ component: TicketsList, props: { params: { field: 'area', value: 4 } } }),
    '/tickets-gerencia': wrap({ component: TicketsList, props: { params: { field: 'area', value: 5 } } }),
    '/tickets-operations': wrap({ component: TicketsList, props: { params: { field: 'requestingArea', value: 7 } } }),

    '/sprints': SprintsList,
    '/addsprints': SprintEdit,
    '/editsprints/:bid': wrap({
        asyncComponent: () => import('./pages/SprintEdit.svelte')
    }),
    '/sprintboard/:sprintId': SprintBoard,

    // Using named parameters, with last being optional
    //'/author/:first/:last?': Author,

    // Wildcard parameter
    //'/book/*': Book,

    // Catch-all
    // This is optional, but if present it must be the last
    '/import-monday': wrap({
        asyncComponent: () => import('./pages/ImportMonday.svelte')
    }),
    '*': NotFound,

   
}
export const tree = [
    {name: 'Dashboard', icon:'mdi mdi-airplay', link:"javascript: void(0);", useLink:false,submenu:[
        // {name: 'Test', link:"/retest", useLink:true},
        {name: 'Inicio', link:"/", useLink:true},
        // {name: 'Interface Formulario', link:"/formlistinterface", useLink:true, access:["admin"]},
        {name: 'Pacientes', link:"/patients", useLink:true, access:["admin"]},
        // {name: 'Historia Clinica', link:"/clinic_history", useLink:true, access:["admin"]},
        // {name: 'Tarjeta de medicacion', link:"/medication_card", useLink:true, access:["admin"]},
        // {name: 'Tarjeta de huesped', link:"/guest_card", useLink:true, access:["admin"]},
        // // {name: 'Pagos huespedes', link:"/guest_payments", useLink:true, access:["admin"]},
        // {name: 'Cobranza mensual', link:"/guest_monthpayments", useLink:true, access:["admin","admin_branch"]}
    ]},
    {name: 'Tickets', icon:'mdi mdi-ticket', link:"javascript: void(0);", useLink:false,submenu:[
        {name: 'Listado Tickets', link:"/tickets", useLink:true, access:["tickets","admin"]},
        {name: 'Mis Tickets', link:"/tickets-assigned", useLink:true, access:["tickets","admin","support"]},
        {name: 'Tickets Cerrados', link:"/tickets-cerrados", useLink:true, access:["tickets","admin"]},
        // {name: 'Autotizar Tickets', link:"/tickets-sistemas-soporte", useLink:true, access:["support","admin"]},
        
        {name: 'Histórico Tickets', link:"/ticketshistory", useLink:true, access:["support","admin"]},
        {name: 'Kanban Tickets', link:"/tickets-kanban", useLink:true, access:["admin", "support"]},
        {name: 'Filtrar Tickets', link:"/tickets-filter-admin", useLink:true, access:["admin", "support"]},
        // {name: 'Incidencias RH', link:"/incidents-rh", useLink:true, access:["admin", "hr"]},
    ]},
    {name: 'Administración Usuarios', icon:'mdi mdi-settings', link:"javascript: void(0);", access:["admin"], useLink:false, submenu:[
        {name: 'Usuarios', link:"/users", useLink:true}
    ]},
    {name: 'Admin', icon:'mdi mdi-block-helper', link:"javascript: void(0);", access:["admin"], useLink:false, submenu:[
        {name: 'Updates', link:"/update", useLink:true},
        {name: 'Backups', link:"/backups", useLink:true},
        {name: 'Importación Monday', link:"/import-monday", useLink:true}
    ]},
    // {name: 'Sprints (Desarrollo)', icon:'mdi mdi-ticket', link:"javascript: void(0);", useLink:false,submenu:[
    //     {name: 'Manejo de Sprint', link:"/sprints", useLink:true, access:["tickets","support","admin"]},
    // ]},
    // {name: 'Tickets por Área', icon:'mdi mdi-ticket', link:"javascript: void(0);", useLink:false,submenu:[
    //     {name: 'Sistemas', link:"/tickets-sistemas", useLink:true, access:["tickets","admin"]},
    //     {name: 'Administrativo', link:"/tickets-administrativo", useLink:true, access:["tickets","admin"]},
    //     {name: 'Recursos Humanos', link:"/tickets-recursos-humanos", useLink:true, access:["tickets","admin"]},
    //     {name: 'Mantenimiento', link:"/tickets-mantenimiento", useLink:true, access:["tickets","admin"]},
    //     {name: 'Comercial', link:"/tickets-comercial", useLink:true, access:["tickets","admin"]},
    //     {name: 'Gerencia', link:"/tickets-gerencia", useLink:true, access:["tickets","admin"]},
    //     {name: 'Operaciones', link:"/tickets-operations", useLink:true, access:["tickets","admin","operations"]},
    // ]},
    // {name: 'Horarios', icon:'mdi mdi-clipboard-account', link:"javascript: void(0);", useLink:false, access:["admin_hours","hr","view_hours"], submenu:[
    //     {name: 'Rol de trabajo', link:"/schedules", useLink:true, access:["admin_hours","hr"]},
    //     {name: 'Asistencia Actual', link:"/scheduledisplay", useLink:true, access:["admin_hours","view_hours","hr"]},
    //     {name: 'Personal', link:"/workers", useLink:true, access:["hr"]},
    //     {name: 'Personal Inactivo', link:"/workersinactive", useLink:true, access:["hr"]},
    //     {name: 'Tabulador de puestos', link:"/positions", useLink:true, access:["hr"]},
    //     {name: 'Asistencias', link:"/workpay", useLink:true, access:["hr"]},
    //     {name: 'Faltas', link:"/workabsences", useLink:true, access:["hr"]},
    //     {name: 'Cargos', link:"/patientlog", useLink:true, access:["hr"]},
    //     {name: 'Vacantes', link:"/jobs", useLink:true, access:["admin_hours","hr"]},
    //     {name: 'Indicadores Vacantes', link:"/jobs_report", useLink:true, access:["hr"]},
        
    // ]},
    // {name: 'Pacientes', icon:'mdi mdi-clipboard-account', link:"javascript: void(0);", useLink:false,submenu:[
    //     {name: 'Listado Pacientes', link:"/patients", useLink:true, access:["admin_branch","admin","accounting"]},
    //     {name: 'Pagos Pacientes', link:"/guest_payments", useLink:true, access:["admin_branch","admin","accounting"]},
    //     {name: 'Pagos huespedes', link:"/guest_payments", useLink:true, access:["admin","accounting"]},
    //     {name: 'Reporte de enfermería', link:"/nursery", useLink:true, access:["admin","admin_branch"]},
    //     {name: 'Medicamenteos bajos en stock', link:"/prescriptions_stock", useLink:true, access:["admin","admin_branch"]},
    //     {name: 'Cobranza mensual', link:"/guest_monthpayments", useLink:true, access:["admin","accounting"]},
    //     {name: 'Cobranza realizada', link:"/guest_monthpaymentsdone", useLink:true, access:["admin","accounting"]},
    //     {name: 'Circulares Estancias', link:"/news", useLink:true, access:["admin"]},
    //     {name: 'Fotos Estancia', link:"/moments", useLink:true, access:["admin"]},
    //     {name: 'Actividades Pacientes', link:"/activities", useLink:true, access:["admin", "admin_branch"]},
    //     {name: 'Agendas Pacientes', link:"/cardActivities", useLink:true, access:["admin", "admin_branch"]},
    //     {name: 'Tarjeta Pacientes', link:"/card", useLink:true, access:["admin"]}
    // ]},
    // {name: 'Pagos', icon:'mdi mdi-clipboard-text', access:["admin_branch","accounting","admin","collect_payments"], link:"javascript: void(0);", useLink:false,submenu:[
    //     {name: 'Pagos Pacientes', link:"/guest_payments", useLink:true, access:["admin_branch","accounting","admin"]},
    //     {name: 'Cobranza mensual', link:"/guest_monthpayments", useLink:true, access:["admin","accounting"]},
    //     {name: 'Pagos Mensuales (IVA)', link:"/payments", useLink:true, access:["admin","accounting"]},
    //     {name: 'Cash Report', link:"/reports/cash_flow", useLink:true, access:["admin","accounting"]},
    //     {name: 'Nuevos Pagos', link:"/patient_payments", useLink:true, access:["admin","accounting","admin_hours"]},
    //     {name: 'Estatus de pagos', link:"/payments_status", useLink:true, access:["admin","accounting"]},
    //     {name: 'Entregar pagos', link:"/payments_deliver", useLink:true, access:["admin","admin_branch","collect_payments"]},
    // ]},
    // {name: 'Incidencias Engargadas', icon:'mdi mdi-clipboard-text', link:"javascript: void(0);", access:["admin", "admin_branch", "operations"], useLink:false,submenu:[
    //     {name: 'DEMO: Reporte QR de familiar', link:"/addincident/0", useLink:true, access:["admin", "admin_branch", "operations"]},
    //     {name: 'Reportar Incidentes Pacientes', link:"/addincident/1", useLink:true, access:["admin", "admin_branch", "operations"]},
    //     // {name: 'Agregar Reporte Seguridad', link:"/addincident/2", useLink:true, access:["admin", "admin_branch", "operations"]},
    //     // {name: 'Agregar Reporte Accidente', link:"/addincident/3", useLink:true, access:["admin", "admin_branch", "operations"]},
    //     {name: 'Reportar Inconformidad de Familiar', link:"/addincident/4", useLink:true, access:["admin", "admin_branch", "operations"]},
    //     {name: 'Reportar Incidente con Personal', link:"/addincident/5", useLink:true, access:["admin", "admin_branch", "operations"]},
    //     {name: 'Dashboard de inicidencias', link:"/incidents", useLink:true, access:["admin","operations"]},
    //     // {name: 'Historial de revisiones', link:"/supervision_tags_check", useLink:true, access:["admin"]},
    // ]},
    // {name: 'Supervisión', icon:'mdi mdi-clipboard-text', link:"javascript: void(0);", access:["admin","admin_branch","operations"], useLink:false,submenu:[
    //     // {name: 'Dashboard', link:"/supervision", useLink:true, access:["admin"]},
    //     // {name: 'Incidentes estancia', link:"/supervision_estancia", useLink:true, access:["admin","operations"]},
    //     {name: 'Calificaciones de actividades', link:"/activities_rating_report", useLink:true, access:["admin","admin_branch","operations"]},
    //     {name: 'Calificaciones de responsables', link:"/workers_rating_report", useLink:true, access:["admin","admin_branch","operations"]},
    //     {name: 'Calificaciones de responsables 2', link:"/workers_rating_report_new", useLink:true, access:["admin","admin_branch","operations"]},
    //     {name: 'Historial de calificaciones', link:"/workers_rating_history", useLink:true, access:["admin","admin_branch","operations"]},
    //     {name: 'Escanear Sensor', link:"/supervisionReader", useLink:true, access:["admin","operations"]},
    //     {name: 'Dashboard supervisiones', link:"/supervision_report", useLink:true, access:["admin","admin_branch","operations"]},
    //     {name: 'Dashboard de inicidencias', link:"/incidents", useLink:true, access:["admin","admin_branch","operations"]},
    //     // {name: 'Demo: Realizar inspección', link:"/addsupervision", useLink:true, access:["admin","operations"]},
    //     {name: 'NFCs de Supervisión', link:"/supervision_tags", useLink:true, access:["admin","operations"]},
    //     {name: 'Ids de Supervisión', link:"/supervision_ids", useLink:true, access:["admin"]},
    //     {name: 'Estatus de revisiones nocturnas', link:"/supervision_tags_report", useLink:true, access:["admin","admin_branch","operations"]},
    //     {name: 'Reporte de pulseras', link:"/supervision_day_report", useLink:true, access:["admin","admin_branch","operations"]},
    //     {name: 'Reporte de minutas', link:"/minute", useLink:true, access:["admin","operations"]},
    //     // {name: 'Historial de revisiones', link:"/supervision_tags_check", useLink:true, access:["admin","operations"]},
    // ]},
    // {name: 'Mantenimiento', icon:'mdi mdi-clipboard-text', link:"javascript: void(0);", access:["admin", "operations"], useLink:false,submenu:[
    //     {name: 'Historial de mantenimiento', link:"/supervision_obs", useLink:true, access:["admin", "operations"]},
    //     {name: 'Realizar mantenimiento', link:"/maintenance", useLink:true, access:["admin", "operations"]},
    //     // {name: 'Historial de revisiones', link:"/supervision_tags_check", useLink:true, access:["admin", "operations"]},
    // ]},
    // {name: 'Inventario', icon:'mdi mdi-clipboard-text', link:"javascript: void(0);", access:["admin_inventory","asign_inventory", "accounting"], useLink:false, submenu:[
    //     {name: 'Estancias', link:"/branches", useLink:true, access:["admin_inventory", "accounting"]},
    //     {name: 'Enfermeria', link:"/pages/nurserylist", useLink:true, access:["admin_inventory"]},
    //     {name: 'Capturar Inventario', link:"/captureinventory", useLink:true, access:["asign_inventory"]},
    //     {name: 'Productos', link:"/products", useLink:true, access:["admin_inventory"]},
    //     {name: 'Ordenes de la semana', link:"/productorders", useLink:true, access:["asign_inventory"]},
    //     {name: 'Ordenes de productos de Limpieza', link:"/cleanorders", useLink:true, access:["admin_inventory"]},
    //     {name: 'Historial', link:"/inventoryhistory", useLink:true, access:["admin_inventory"]},
    //     {name: 'Reporte Mensual', link:"/reports/inventorypurchases", useLink:true, access:["admin_inventory"]}
    // ]},
    // {name: 'RH', icon:'mdi mdi-clipboard-account', link:"javascript: void(0);", useLink:false, access:["hr",'self_hr'], submenu:[
    //     {name: 'Personal', link:"/partners", useLink:true, access:["hr"]},
    //     {name: 'Prospectos Personal', link:"/partnersweb", useLink:true, access:["hr"]},
    //     {name: 'Alta Personal', link:"/addpartners", useLink:true, access:["self_hr"]},
    //     {name: 'Vacaciones', link:"/vacations", useLink:true, access:["hr"]},
    //     {name: 'Reporte Salarios', link:"/reports/salary", useLink:true, access:["hr"]},
    //     {name: 'Recibos', link:"/pages/tickets", useLink:true, access:["nominas","hr"]},
    //     {name: 'Recibos (update)', link:"/pages/tickets2", useLink:true, access:["nominas","hr"]},
    //     {name: 'Requisiciones', link:"/pages/requisition", useLink:true, access:["nominas"]},
    //     {name: 'Notificaciones', link:"/notifyadmin", useLink:true, access:["hr"]},
    //     {name: 'Asistencia Maestras', link:"/pages/assistance", useLink:true, access:["hr"]},
    //     {name: 'Cumpleaños', link:"/birthdays", useLink:true, access:["hr"]}
    // ]},
    // {name: 'App Olivos', icon:'mdi mdi-clipboard-account', link:"javascript: void(0);", useLink:false,submenu:[
    //     {name: 'Medicamenteos bajos en stock', link:"/prescriptions_stock", useLink:true, access:["admin","admin_branch"]},
    //     {name: 'Circulares Estancias', link:"/news", useLink:true, access:["admin"]},
    //     {name: 'Fotos Estancia', link:"/moments", useLink:true, access:["admin"]},
    //     {name: 'Retroalimentación', link:"/moments", useLink:true, access:["admin"]},
    //     {name: 'Actividades Pacientes', link:"/activities", useLink:true, access:["admin", "admin_branch"]},
    //     {name: 'Blog Olivos', link:"/cardActivities", useLink:true, access:["admin", "admin_branch"]}
    // ]},
    // {name: 'Concentradores', icon:'mdi mdi-clipboard-account', link:"javascript: void(0);", useLink:false, access:["oxigenica"], submenu:[
    //     {name: 'Concentradores', link:"/equipment", useLink:true},
    //     {name: 'Rentas/Ventas', link:"/equipmentsales", useLink:true},
    //     {name: 'Estatus actual', link:"/equipment", useLink:true},
    // ]},
    // {name: 'Ubicare', icon:'mdi mdi-cellphone', link:"javascript: void(0);", useLink:false, access:["admin_medi"], submenu:[
    //     {name: 'Enfermeros', link:"/partners", useLink:true},
    //     {name: 'Clientes', link:"/clients", useLink:true},
    //     {name: 'Servicios', link:"/services", useLink:true},
    //     {name: 'Pagos', link:"/payments", useLink:true},
    //     {name: 'Buzon de Ayuda', link:"/partnercontact", useLink:true},
    // ]},
    
    // {name: 'Documentos Olivos', icon:'mdi mdi-clipboard-arrow-down', link:"javascript: void(0);", access:["admin","admin_hours","hr"], useLink:false, submenu:[
    //     {name: 'Formatos Oficiales', link:"/documents", useLink:true}
    // ]},
];
