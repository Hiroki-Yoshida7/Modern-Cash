import { Injectable} from '@angular/core';
import { Web3 } from './web3.service';
import { AccountService } from './account.service';
import { EtherscanService } from './etherscan.service';
import { Http, Headers, RequestOptions } from "@angular/http";
import { LSCXMarketService } from './LSCX-market.service';
import { MdDialog } from '@angular/material';
import { TikerDialogComponent } from '../components/dialogs/tiker-dialog.component';
import { flattenStyles } from '@angular/platform-browser/src/dom/dom_renderer';
var fs = require('fs');

@Injectable()
export class ContractStorageService {
    contracts: Array<any>;
    LSCX_Contracts: Array<any>;
    customContracts: Array<any>;
    addDialog = null;

    constructor(private _web3: Web3, private _account: AccountService,private dialog: MdDialog, private _LSCXmarket: LSCXMarketService, protected _scan : EtherscanService, protected http : Http){
        this.setContracts();
        this.setAccContracts();
    }

    setContracts(){
        if(localStorage.getItem('contracts')){
            this.contracts= JSON.parse(localStorage.getItem('contracts'));
        }else{
            this.contracts = [];
        }
    }

    setAccContracts(){
        this.LSCX_Contracts = this.contracts.filter(contract=> contract.account == this._account.account.address && contract.network == this._web3.network.chain && contract.type != "custom");
        this.customContracts = this.contracts.filter(contract=> contract.account == this._account.account.address && contract.network == this._web3.network.chain && contract.type == "custom");
    }

    deletContract(contract){
        
        this.contracts= this.contracts.filter(c=> JSON.stringify(c) !=JSON.stringify(contract));
        this.saveContracts();
        this.setAccContracts();
    }

    removeAccContracts(address){
        this.contracts = this.contracts.filter(contract=> contract.account != address);
        this.saveContracts();
    }

    addContract(contract){
            this.contracts.push(contract);
            this.saveContracts();
            this.setAccContracts();
    }
    
    isDuplicated(address, account){
        let result = this.contracts.findIndex(contract=> contract.address == address && contract.account == account);
        if(result !=-1){
            return true
        }else{
            return false
        }

    }
    async checkForAddress(){
        let checkInterval= setInterval(async()=>{
            let pending = [];
            this.contracts.forEach((contract, index)=> {
                if(contract.active==false){
                    pending.push(index);        
                }
            })    
            if(pending.length==0){
                clearInterval(checkInterval)
            }
            for(let i=0; i<pending.length; i++){
                let contractAddr = await this._web3.getTxContractAddress(this.contracts[pending[i]].deployHash);                
                if(contractAddr!= null){                    
                    this.contracts[pending[i]].address = contractAddr;
                    this.contracts[pending[i]].active = true;
                    if(this.addDialog == null) {
                        this.openTikerDialog(this.contracts[pending[i]], true);
                    }
                    await this.verifyContract(contractAddr)
                }    
                this.saveContracts();
            }

        },3000);
        
    }
    

    saveContracts(){
        if(this.contracts == []) {
            localStorage.removeItem('contracts');
        } else {
            localStorage.setItem('contracts', JSON.stringify(this.contracts));
        }
    }

    async verifyContract(contractAddr){
        let info = JSON.parse(localStorage.getItem("deployInfo"));
        let _compilerversion;
        let _contractName;
        let _sourceCode:string;

        if(info.contract == "LSCX_ABT"){
            _compilerversion = "v0.4.19+commit.c4cbbb05"
                        _contractName = "ModernCash_ABT";
        }
        if(info.contract == "LSCX_CIF"){
            _compilerversion = "v0.4.19+commit.c4cbbb05"
            _contractName = "ModernCash_CIF";
        }
        if(info.contract == "LSCX_MDCS"){
            _compilerversion = "v0.4.24+commit.e67f0147"
            _contractName = "ModernCash_MDCS";
        }
        if(info.contract == "LSCX_ISC"){
            _compilerversion = "v0.4.24+commit.e67f0147";
            _contractName = "ModernCash_ISC";
        }
                    
        let self = this;
                    
        await fs.readFile("./src/LSCX-contracts/"+info.contract+".sol", function(err, data) {
            if (err) {
                return console.log(err);
            }
            if (data) {
                var x = data.toString();
                _sourceCode = x;
                self._scan.setUrlStarts();
                let net = self._scan.urlStarts.replace("-", "");
                if(net!=""){
                    net = net+".";
                }
                let url = "https://"+net+"etherscan.io/address/"+contractAddr;
                let headers = new Headers();
                headers.append('Content-Type', 'text/html');
                setTimeout(function(){
                    self.http.get(url,  {headers: headers}).subscribe((res:any) =>{
                        let x = res._body;
                        let len = x.length                        
                        let y = x.split("pre")[4];
                        let z = y.split(">")[1];
                        let a =z.split("<")[0];
                        let _constructorArguments = a;
                        
                        try {
                            self._scan.setVerified(contractAddr, _sourceCode, _contractName, _compilerversion, _constructorArguments)    
                        } catch (error) {
                            console.log("error set verified????", error);
                        }
                        
                    }, err =>{
                        console.log(err);               
                    });
                }, 120000);
            }
        });          
    }

    openTikerDialog(contract, deploy:boolean) {
        this.addDialog = this.dialog.open(TikerDialogComponent,{
            width: '660px',
            height: '250px',
            data: {
                contract: contract,
                fees: this._LSCXmarket.fees.feeMarket,
                deploy: deploy
            }
          });
        this.addDialog.afterClosed().subscribe(()=>{
            this.addDialog = null;
        });
    }

}