import { render, fireEvent, screen } from '@testing-library/svelte';
// import Tickets from "../pages/Tickets.svelte";
import Tickets from "../pages/Tickets.svelte";
import { tick } from 'svelte';
import { link } from "svelte-spa-router";
import { pop } from "svelte-spa-router";
import { getDb, testAldoTickets, testAldoMesTickets, testAldoDobleUnidadTickets } from './mockfirebase';
// import { workers } from '../controls/workers';
import { readable } from 'svelte/store';
// jest.mock('svelte-spa-router'); 
jest.mock('svelte-spa-router', () => ({
  link: jest.fn(),
  pop:jest.fn()
}))
jest.mock('../controls/workers');

// jest.mock('workers', () => (readable([{id:"pM6xuIggkxdHmzaN3n82",name:"Aldo Pruen", paymethod:0}])))
// const mockWorkers = () => readable([{id:"pM6xuIggkxdHmzaN3n82",name:"Aldo Pruen", paymethod:0}]);
// jest.mock('../controls/workers', () => {
//   return jest.fn().mockImplementation(() => {
//     return {workers: mockWorkers};
//   })
// }
// );

describe("Ticket test", () => {
//   beforeAll(()=>{
//     // beforeAll
//     jest.spyOn('window.db', 'get')
// .mockImplementation(()=>({
//   collection:(node)=>({
//     orderBy:()=>({
//       onSnapshot:jest.fn()
//     })
//   })
// }));

// afterAll
// jest.restoreAllMocks();
  // });
    const props = {
      id: "component",
      class: "component-custom",
      style: "width: 100%; height: 100%",
    };
    
    // global.db = {
    //   //db: ()=>({
    //   collection:(node)=>({
    //     orderBy:()=>({
    //       onSnapshot:jest.fn()
    //     }),
    //     where:()=>({
    //       where:()=>({
    //         orderBy:()=>({
    //             onSnapshot:jest.fn()
    //         })
    //       })
    //     })
    //   })
    //   //})
    // };
    global.DateTime = {
      local:()=>({
        setLocale:()=>({
          toISODate:()=>{ return "2022-12-12";},
          startOf:()=>({ 
            toISODate:()=>{ return "2022-12-01";}
          }),
          endOf:()=>({ 
            toISODate:()=>{ return "2022-12-31";}
          })
        }),
        toISODate:()=>{ return "2022-12-12";},
        startOf:()=>({ 
          toISODate:()=>{ return "2022-12-01";}
        }),
        endOf:()=>({ 
          toISODate:()=>{ return "2022-12-31";}
        })
      }),
      fromISO:(d)=>({
        toJSDate:()=>{ return new Date(2022,12,12);},
        endOf:()=>({
          toJSDate:()=>{ return new Date(2022,12,12);}
        })
      }),
      
    }
    // jest.mock("db",()=>({
    //   collection:(node)=>({orderBy:()=>({onSnapshot:jest.fn()})})
    // }))
    it("should render properly", () => {
      global.db = getDb(testAldoTickets);
      const result = render(Tickets); //, { props }
      expect(() => result).not.toThrow();
    });

    it("no tiene recibos", async () => {
      global.db = getDb();
      const { container } = render(Tickets);
      const component = container.getElementsByClassName("table");
      // expect(testTickets.length);

      await tick();
      
      expect(component.length).toEqual(0);
      
    });
    it("tiene recibo de aldo con guardias", async () => {
        global.db = getDb(testAldoTickets);
        const { container } = render(Tickets);
        const component = container.getElementsByClassName("table");
        expect(testAldoTickets.length).toBeGreaterThan(3);

        await tick();
        expect(component.length).toEqual(1);
        //console.log("recipt",component[0].innerHTML);

        const node = screen.queryByText("Personal: Aldo pruen");
        expect(node).not.toBeNull(); 

        const nodeGuardias = screen.queryByText("3 Guardias 3 Complementos");
        expect(nodeGuardias).not.toBeNull();
        
        //TODO: revisar
        const nodeTotal = screen.queryByText("$ 8050.00");
        expect(nodeTotal).not.toBeNull();
        
      });

      it("tiene recibo de aldo con mes", async () => {
        global.db = getDb(testAldoMesTickets);
        const { container } = render(Tickets);
        const component = container.getElementsByClassName("table");
        expect(testAldoTickets.length).toBeGreaterThan(3);

        await tick();
        expect(component.length).toEqual(1);
        //console.log("recipt",component[0].innerHTML);

        const node = screen.queryByText("Personal: Aldo Mensual");
        expect(node).not.toBeNull();

        const nodeGuardias = screen.queryByText("3 Guardias 3 Complementos");
        expect(nodeGuardias).not.toBeNull();
        
        //TODO: revisar
        const nodeTotal = screen.queryByText("$ 8650.00");
        expect(nodeTotal).not.toBeNull();
        
      });

  });