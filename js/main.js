$("#datepicker input").datepicker({
  maxViewMode: 2,
  todayBtn: true,
  language: "es",
  daysOfWeekDisabled: "0,6",
  daysOfWeekHighlighted: "1,2,3,4,5",
  autoclose: true,
  todayHighlight: true,
  startDate: "Date()",
});

async function getCalendario() {
  const response = await fetch(
    "https://getpantry.cloud/apiv1/pantry/3e9ad87f-df1b-429a-936e-4b0a41215b6e/basket/calendario"
  );
  const citasAlmacenadas = await response.json();
  return citasAlmacenadas;
}

async function postData(url = "", data = {}) {
  // Default options are marked with *
  const response = await fetch(url, {
    method: "POST", // *GET, POST, PUT, DELETE, etc.
    mode: "cors", // no-cors, *cors, same-origin
    cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
    credentials: "same-origin", // include, *same-origin, omit
    headers: {
      "Content-Type": "application/json",
      // 'Content-Type': 'application/x-www-form-urlencoded',
    },
    redirect: "follow", // manual, *follow, error
    referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    body: JSON.stringify(data), // body data type must match "Content-Type" header
  });
  return response.json(); // parses JSON response into native JavaScript objects
}

document.addEventListener("DOMContentLoaded", async function () {
  var calendarEl = document.getElementById("calendar");
  var calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
  });
/*   const data = await getCalendario();
  const calendarToUse = [];
  for (const [key, value] of Object.entries(data)) {
    calendarToUse.push({ id: key, ...value });
  } */
  //agregarCitaAlDom(calendarToUse.pop());
  calendar.render();
});
class Cita {
  constructor(nombre, anio, mes, dia, hora) {
    this.nombre = nombre;
    this.anio = Number(anio);
    this.mes = Number(mes);
    this.dia = Number(dia);
    this.hora = Number(hora);
    this.fecha = new Date(
      this.anio,
      this.mes - 1,
      this.dia,
      this.hora
    ).toJSON(); //se agrega Date() por si se ocupa después
    this.fechaCreacion = Date();
    this.usuario = firebase.auth().currentUser.uid;
  }
}

const formaCita = document.getElementById("formaCita");
const citasAgregadas = document.getElementById("citaAgregada");
const alerta = document.getElementById("alerta");
const modalRegistrada = bootstrap.Modal.getOrCreateInstance(document.getElementById('citaRegistrada'));
const modalRegis = document.getElementById("citaRegistrada");
const modalRegistradContenido = document.getElementById("contenidoCitaRegistrada");
modalRegis.addEventListener('hidden.bs.modal', function() { formaCita.reset(); });
function validateCalendar(citasAlmacenadas, cita) {
  const duplicado = citasAlmacenadas.filter(
    (obj) =>
      obj.anio === cita.anio &&
      obj.mes === cita.mes &&
      obj.dia === cita.dia &&
      obj.hora === cita.hora
  );
  return duplicado.length > 0;
}

formaCita.addEventListener(
  "submit",
  async (e) => {
    if (!formaCita.checkValidity()) {
      e.preventDefault();
      e.stopImmediatePropagation();
    } else {
        if(!firebase.auth().currentUser){
            e.preventDefault();
            document.querySelector('#login').click()
        }else{
            e.preventDefault();
            let nombre = document.getElementById("nombre").value;
            let fechaCompleta = document.getElementById("fecha").value.split("/");
            let anio = fechaCompleta[2];
            let mes = fechaCompleta[1];
            let dia = fechaCompleta[0];
            let hora = document.getElementById("floatingSelectGrid").value;
            const cita = new Cita(nombre, anio, mes, dia, hora);
            const data = await getCalendario();
            const calendarToUse = [];
            for (const [key, value] of Object.entries(data)) {
              calendarToUse.push(value);
            }
            if (!validateCalendar(calendarToUse, cita)) {
                const citasDelUsuario = calendarToUse.find((infoCita)=>infoCita.usuario === firebase.auth().currentUser.uid);
                if(citasDelUsuario === void(0)){
                    guardarCita(cita);
                    agregarCitaAlDom(cita);
                    modalCitaRegistrada(cita);
                }else{
                    alertaYaTiene();
                }
            } else {
              alertaDuplicado();
            }
          }
        }
     

    formaCita.classList.add("was-validated");
  },
  false
);

async function borrarCita(idCita) {
  const dataCitas = await getCalendario();
  for (const [key, value] of Object.entries(dataCitas)) {
    if (key === idCita.toString()) {
      delete dataCitas[`${key}`];
    }
  }
  citasAgregadas.innerHTML = ""
  postData(
    "https://getpantry.cloud/apiv1/pantry/3e9ad87f-df1b-429a-936e-4b0a41215b6e/basket/calendario",
    dataCitas
  )
}

async function guardarCita(cita) {
  const dataCalendario = await getCalendario();
  dataCalendario[`${Math.random() * 100}`] = cita;
  postData(
    "https://getpantry.cloud/apiv1/pantry/3e9ad87f-df1b-429a-936e-4b0a41215b6e/basket/calendario",
    dataCalendario
  ).then((data) => {
  });
}

function agregarCitaAlDom(cita) {
  citasAgregadas.innerHTML = `<div class="card text-center" id="card">
    <div class="card-header">
      Cita
    </div>
    <div class="card-body">
      <h5 class="card-title">Agregaste una cita ${cita?.nombre}</h5>
      <p class="card-text">Tu cita es para el ${cita?.dia}/${cita?.mes}/${
    cita?.anio
  } a las ${cita?.hora}:00 horas</p>
      <a class="btn btn-primary" id="cancelarCita" onclick="borrarCita(${
        cita?.id
      })">Cancelar cita</a>
    </div>
    <div class="card-footer text-body-secondary">
      Recuerda llegar 5 minutos antes a tu cita.
    </div>
  </div>`;
}

const logoutBtn = document.querySelector('#logout-btn');
logoutBtn.addEventListener('click', e => {
  e.preventDefault();
  firebase.auth().signOut();
  console.log('User signed out!');
})


const loginSubmit = document.querySelector('#login-submit-btn');
loginSubmit.addEventListener('click', e => {
  e.preventDefault();
  var email = document.querySelector('#email').value
  var password = document.querySelector('#password').value
  firebase.auth().signInWithEmailAndPassword(email, password).then(function() {
    document.querySelector('#btn-close-modal').click()
  }).catch(function(error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    alert(errorCode+' '+errorMessage);
});
})

function alertaDuplicado() {
  alerta.innerHTML = `<div class="alert alert-danger text-center alert-dismissible" role="alert">
        Esta cita ya esta registrada.
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>`;
}

function alertaYaTiene() {
  alerta.innerHTML = `<div class="alert alert-danger text-center alert-dismissible" role="alert" >
    Ya tienes una cita, puede borrarla y agregar otra si gustas.
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
</div>`;
}

function modalCitaRegistrada(cita) {
  modalRegistrada.show();
  modalRegistradContenido.innerHTML = `<div class="card text-center" id="card">
  <div class="card-header">
    Cita
  </div>
  <div class="card-body">
    <h5 class="card-title">Agregaste una cita ${cita.nombre}</h5>
    <p class="card-text">Tu cita es para el ${cita.dia}/${cita.mes}/${cita.anio} a las ${cita.hora}:00 horas</p>
    <a class="btn btn-primary" id="cancelarCita" onclick="borrarCita(${cita.id})">Cancelar cita</a>
  </div>
  <div class="card-footer text-body-secondary">
    Recuerda llegar 5 minutos antes a tu cita.
  </div>
</div>`;
}

//document.getElementById("cancelarCita").addEventListener("click", borrarCita(calendario), false);

/* function eliminarCitaCalendario(calendario) {
  let citaguardada = JSON.parse(localStorage.getItem("cita"));
  let idx = calendario.findIndex((obj) => obj.fecha == citaguardada.fecha);
  if (idx >= 0) calendario.splice(idx, 1);
} */

/* const config = {
    name: "Cita para plan nutricional",
    description: "Esta es tu cita para tu plan nutricional y asesoría, recuerda contar con los datos que se te pide",
    startDate: cita.anio + "-" + cita.mes + "-" + cita.dia,
    startTime: cita.hora + ":00",
    endTime: (cita.hora + 1) + ":00",
    options: ["Apple", "Google", "Outlook.com", "Yahoo"],
    timeZone: "America/Mexico_City"
};
const button = document.getElementById('botonCalendario');
if (button) {
    button.addEventListener('click', () => atcb_action(config, button));
} */
