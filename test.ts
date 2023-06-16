import {validateSync, IsNotEmpty} from 'class-validator';

class TestValidator{
    @IsNotEmpty()
    name: string;

    @IsNotEmpty()
    type: string
}

const obj = new TestValidator();
obj.name = '11';
obj.type = '22';
//@ts-ignore
obj.xpto = '222'
const valid = validateSync(obj, {forbidUnknownValues: true})

console.log(valid.)