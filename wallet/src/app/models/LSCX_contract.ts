export class LSCX_Contract {
    public address: String;
    public type: String;
    public deployHash: String;
    public name: string;
    public decimals: number;
    public symbol: string;
    public totalSupply: number;
    public active: boolean;
    public account: string;
    public standard: string;
    public network: number;

    constructor(){
        this.active = false;
    }
    
    deployContract(hash, info, type, account, network){
        this.network = network;
        this.deployHash = hash;
        this.name = info.name;
        this.symbol = info.symbol;
        this.totalSupply = info.totalSupply;
        this.type = type;
        this.account = account;
        this.decimals = (type=="LSCX_MDCS")? 18 : 8;
        this.setStandard(type);
    }
    
    importContract(address, hash, type, account, info, network){
        this.network = network;
        this.address = address;
        this.deployHash = hash;
        this.type = type;
        this.decimals = (type=="LSCX_MDCS")? 18 : 8;
        this.account = account;
        this.active = true;
        this.name = info.name;
        this.symbol = info.symbol;
        this.totalSupply = info.totalSupply;
        this.setStandard(type);
    }
    
    setStandard(type){
        switch(type){
            case "LSCX_ABT":
                this.standard =  "ERC20 ModernCash ABT";
                break;
            case "LSCX_CIF":
                this.standard =  "ERC20 ModernCash CIF";
                break;
            case "LSCX_MDCS":
                this.standard =  "ERC20 ModernCash MDCS";
                break;
            case "LSCX_ISC":
                this.standard =  "ERC20 ModernCash ISC";
                break;
        }
    }
}