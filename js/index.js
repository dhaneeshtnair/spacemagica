  var xyz = null;
  function XYZ(token){
      this.token=token;
    }
    XYZ.prototype.spaces=async function(){
       const ret = await fetch(`https://xyz.api.here.com/hub/spaces?access_token=${this.token}`);
       return await ret.json();
   }

  XYZ.prototype.fetch=async function(spaceId){
       var handle=0;
       let data=new Array();
       while(handle!=-1){
          const ret = await fetch(`https://xyz.api.here.com/hub/spaces/${spaceId}/iterate?limit=5000&handle=${handle}&access_token=${this.token}`);
          const res =  await ret.json();
          if(res.handle){
            handle  = res.handle;
          }else{
            handle=-1;
          }
          data = data.concat(res.features);
       }
       return {"type":"FeatureCollection",features:data};
  }
  var myChart=null;
  
   let token =null;// localStorage.getItem("token");
   function checkToken(){
      token = localStorage.getItem("token");
      if(!token){
        $('#myModal').modal('show');
      }else{
        $("#tokenText").val(token);
        $('#myModal').modal('hide');
        initXYZ();
      }
   }
   function saveModal(){
      token = $("#tokenText").val();
      if(token && token!=""){
        localStorage.setItem("token",token);
      }
      checkToken();
   }
   $(document).ready(function(){
    checkToken();
   });
  
    function renderBarChart(spaceId,map){
      if(myChart!=null){
        myChart.destroy();
    }
    let labels =[];
    let datas =[];
    
    map.forEach(x=>{
      labels.push(x.key);
      datas.push(x.value);
    });
    $("#myChart").empty();
    var ctx = document.getElementById("myChart").getContext('2d');
     myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'spaceId '+spaceId,
                data: datas,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(255, 159, 64, 0.2)'
                ],
                borderColor: [
                    'rgba(255,99,132,1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero:true
                    }
                }]
            }
        }
    });
  }


    

    function initXYZ(){
      xyz=new XYZ(token);
      (async ()=>{
          const data =await xyz.spaces();
          $("#spaces").empty();
          $("#spaces").append('<option>Select Space</option>');
          data.forEach(element => {
            $("#spaces").append(`<option value="${element.id}">${element.id} ( ${element.title} )</option>`);
          });
      })();
    }

     $("#spaces").change(async function(){
        lastData=null;
        processSpace($(this).val(),true);
     });
     $("#property").change(function(){
        processSpace($("#spaces").val());
     });
     $("#xAxes").change(function(){
      processSpace($("#spaces").val(),true);
     });
     let lastData=null;
     async function processSpace(spaceId,clear){
        $(".animationload").css("display","block");
        const statMp = [];
        if(!lastData){
          lastData =await xyz.fetch(spaceId);
        }
        let d = lastData;
        let filter= $("#filter").val();
        if(filter){
            let ff = d.features.filter(feature=>{
                let x = eval(filter);
                return x;
            });
            d.features = ff;
        }
        if(clear){
          $("#property").empty();
          if(d.features[0]){
            for(var k in d.features[0].properties){
              $("#property").append(`<option value="${k}">${k}</option>`);
            }
          }
          
        }
        if($("#xAxes").val()=="tags"){
          d.features.forEach(x=>{
              x.properties['@ns:com:here:xyz'].tags.forEach(y=>{
                let count= statMp[y]?statMp[y]:0;
                statMp[y]=++count;
              });
          });
        }
        if($("#xAxes").val()=="properties"){
          let pNme= $("#property").val();
          

          if(pNme){
            d.features.forEach(x=>{
                  let y=x.properties[pNme];
                  if(y!=null && y!=undefined){
                    let count= statMp[y]?statMp[y]:0;
                    statMp[y]=++count;
                  }
            });
          }
          

        }
        let c = document.getElementById("count").value;
        let ci = c=="All"?-1:c;
        renderBarChart(spaceId,makeStats(statMp,ci));
        $(".animationload").css("display","none");
     }

     function makeStats(statMp,count){
        var aa=new Array();
        for(var k in statMp){
            aa.push({key:k,value:statMp[k]});
        }
        console.log(statMp);
        aa.sort(function(a, b){
          return  b.value-a.value;
        });
        if(count>0)
        aa= aa.slice(0, count);
        return aa;
     }

    $("#xAxes").change(function(){
      const v = $(this).val();
      if(v=="properties"){
        $(".pg").css("display","block");
      }else{
        $(".pg").css("display","none");
      }
    });

    $("#theme").change(function(){
        $("#main").css("background",$(this).val());
        refresh();
    });

    $("#count").change(function(){
        refresh();
    });
    function refresh(){
        processSpace($("#spaces").val());
    }

    $( '#filter' ).on( 'keydown', function ( evt ) {
        if( evt.keyCode == 13 )
            refresh();
    } ); 