import { IMultiSelectField, ISelectFieldOption } from "@lark-base-open/js-sdk";

export const getMultiSelectOptions = async (field: IMultiSelectField, tagNames: string[]) => {
  const newOptionName: string[] = [];
  const currentOptions = await field.getOptions();
  const res: ISelectFieldOption[] = [];
  tagNames.forEach((tagName) => {
    const op = currentOptions.find(opt => opt.name === tagName);
    if (op) {
      res.push(op);
    } else {
      newOptionName.push(tagName);
    }
  });
  if (newOptionName.length) {
    await field.addOptions(newOptionName.map(name => ({ name })));
    const newOptions = await field.getOptions();
    // 添加之后再获取一次
    newOptionName.forEach(name => {
      const op = newOptions.find(opt => opt.name === name);
      if (op) {
        res.push(op);
      }
    });
  }
  return res;
}

export const asyncForEach = (array: any[], callback: (item: any) => Promise<void>): Promise<void> => {
  let completedCount = 0; // 计数器，用于跟踪已完成的异步任务数量
  
  return new Promise((resolve) => {
    array.forEach(async (item) => {
      await callback(item);
      completedCount++;

      if (completedCount === array.length) {
        resolve();
      }
    });
  });
};