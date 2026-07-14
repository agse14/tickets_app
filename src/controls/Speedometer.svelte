<script>
    export let label="Desempeño";
    export let value=0;
    export let min=0;
    export let max=100;
    export let unit="%";
    export let inverse=false;

    $: rotation = (value - min) * 180 / max;

</script>
<div class="box">
    <div class="meter position-relative">
      <ul class="chart-skills" class:inverse={inverse} >
        <li>
          <span></span>
        </li>
        <li>
          <span></span>
        </li>
        <li>
          <span></span>
        </li>
        <li>
          <span></span>
        </li>
      </ul>
  <div style="width:195px;">
  <div style="float:left;">
    {#if inverse}
        Bien - 
    {:else}
        Mal -
    {/if}
    {min}
</div>
  <div style="float:right">
    {#if inverse}
        Mal - 
    {:else}
        Bien - 
    {/if}
    {max}
    </div>
  
  </div>
   
      <img src="https://1.bp.blogspot.com/-46OIskSGdZc/WwzuFQ4Z24I/AAAAAAAAAsE/r-ElKrZKPNARDFGl5bY7-DHo7B-DSeJAgCLcBGAs/s1600/meter-hand.png" alt="" class="meter-hand" 
      id="hand"
      style="-webkit-transform: rotate({rotation}deg);-moz-transform: rotate({rotation}deg);-ms-transform: rotate({rotation}deg);-o-transform: rotate({rotation}deg);transform: rotate({rotation}deg);"
      >
    </div>
    <div class="text-center mt-4">
      <div class="speed"><span id="speed">{value} {unit}</span></div>
      <div class="unit">{label}</div>
    </div>
  </div>
  <style>
 .box {
  width: 100%;
  max-width: 90%;
  padding: 1rem;
  display: block;
  border-radius: 1.5rem;
  background-color: rgb(255, 255, 255);
  box-shadow: 0px 0px 15.84px 0.16px rgba(35, 31, 32, 0.1);
}

.meter {
  width: 188px;
  margin: 30px auto 0;
  position: relative;
}

.meter-hand {
  position: absolute;
  /* left: 45%; */
  bottom: 6px;
  margin-left: -5px;
  z-index: 1;
  transition: all 2s ease-in-out;
  transform-origin: 94% 48%;
}

.speed {
  font-size: 3.1rem;
  font-weight: 700;
  line-height: 1;
}

#speed {
  /* min-width: 300px; */
  display: inline-block;
}

.unit {
  font-size: 1.0rem;
  font-weight: 500;
  color: #bbe697;
}

.meter .num {
  font-size: 1rem;
  font-weight: 600;
  position: absolute;
}

#num_1 {
  left: 25px;
  top: 80px;
}

#num_2 {
  left: 37px;
  top: 56px;
}

#num_3 {
  left: 55px;
  top: 35px;
}

#num_4 {
  left: 87px;
  top: 25px;
}

#num_5 {
  right: 55px;
  top: 35px;
}

#num_6 {
  right: 37px;
  top: 56px;
}

#num_7 {
  right: 25px;
  top: 80px;
}

/* RESET STYLES
–––––––––––––––––––––––––––––––––––––––––––––––––– */

.chart-skills {
  margin: 0 auto;
  padding: 0;
  list-style-type: none;
}

.chart-skills *,
.chart-skills::before {
  box-sizing: border-box;
}

/* CHART-SKILLS STYLES
–––––––––––––––––––––––––––––––––––––––––––––––––– */

.chart-skills {
  position: relative;
  width: 180px;
  height: 90px;
  overflow: hidden;
}

.chart-skills::before,
.chart-skills::after {
  position: absolute;
}

.chart-skills::before {
  content: '';
  width: inherit;
  height: inherit;
  border: 45px solid rgba(211, 211, 211, .3);
  border-bottom: none;
  border-top-left-radius: 175px;
  border-top-right-radius: 175px;
}

.chart-skills::after {
  content: '';
  left: 50%;
  bottom: 10px;
  transform: translateX(-50%);
  font-size: 1.1rem;
  font-weight: bold;
  color: cadetblue;
}

.chart-skills li {
  position: absolute;
  top: 100%;
  left: 0;
  width: inherit;
  height: inherit;
  border: 45px solid;
  border-top: none;
  border-bottom-left-radius: 175px;
  border-bottom-right-radius: 175px;
  transform-origin: 50% 0;
  animation-fill-mode: forwards;
  animation-duration: .4s;
  animation-timing-function: linear;
  transform-style: preserve-3d;
  backface-visibility: hidden;
}

.chart-skills li:nth-child(1) {
  z-index: 4;
  border-color: #ED7E3D;
  animation-name: rotate-one;
}

.chart-skills li:nth-child(2) {
  z-index: 3;
  border-color: #F0D440;
  animation-name: rotate-two;
  animation-delay: .4s;
}

.chart-skills li:nth-child(3) {
  z-index: 2;
  border-color: #8EC34A;
  animation-name: rotate-three;
  animation-delay: .8s;
}

.chart-skills li:nth-child(4) {
  z-index: 1;
  border-color: #29B151;
  animation-name: rotate-four;
  animation-delay: 1.2s;
}
.chart-skills.inverse li:nth-child(1) {
    border-color: #29B151;
}

.chart-skills.inverse li:nth-child(2) {
    border-color: #8EC34A;
}

.chart-skills.inverse li:nth-child(3) {
  border-color: #F0D440;
}

.chart-skills.inverse li:nth-child(4) {
  border-color: #ED7E3D;
}

/* ANIMATIONS
–––––––––––––––––––––––––––––––––––––––––––––––––– */

@keyframes rotate-one {
  100% {
    transform: rotate(45deg);
    /**
     * 12% => 21.6deg
     */
  }
}

@keyframes rotate-two {
  0% {
    transform: rotate(45deg);
  }
  100% {
    transform: rotate(90deg);
    /**
     * 32% => 57.6deg 
     * 57.6 + 21.6 => 79.2deg
     */
  }
}

@keyframes rotate-three {
  0% {
    transform: rotate(90deg);
  }
  100% {
    transform: rotate(135deg);
    /**
     * 34% => 61.2deg 
     * 61.2 + 79.2 => 140.4deg
     */
  }
}

@keyframes rotate-four {
  0% {
    transform: rotate(135deg);
  }
  100% {
    transform: rotate(180deg);
    /**
     * 22% => 39.6deg  
     * 140.4 + 39.6 => 180deg
     */
  }
}

</style>