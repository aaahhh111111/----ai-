import { PrismaClient, KnowledgeStatus, KnowledgeSource } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.knowledge.count();
  if (count > 0) return;

  const samples = [
    {
      title: "采购审批流程",
      content:
        "金额 5 万以下由部门负责人审批；5-50 万需财务与采购双线会签；50 万以上需 VP 审批。所有采购需在 OA 提交申请并附三家比价单。",
      summary: "采购金额分级审批规则",
      tags: JSON.stringify(["采购", "审批", "流程"]),
      category: "采购",
      source: KnowledgeSource.MANUAL,
    },
    {
      title: "员工入职 IT 账号开通",
      content:
        "HR 在 People 系统完成入职后，IT 自动开通邮箱、飞书、VPN。研发岗位额外开通代码仓库权限，需直属 leader 在权限平台二次确认。",
      summary: "新员工账号与权限开通说明",
      tags: JSON.stringify(["人事", "IT", "入职"]),
      category: "人事",
      source: KnowledgeSource.MANUAL,
    },
    {
      title: "数据出境合规要点",
      content:
        "涉及用户个人信息出境需完成 DPIA 评估；跨境传输须签订标准合同或取得认证；禁止将未脱敏日志传输至境外测试环境。",
      summary: "隐私与跨境数据传输要求",
      tags: JSON.stringify(["合规", "隐私", "安全"]),
      category: "法务",
      source: KnowledgeSource.MANUAL,
    },
    {
      title: "AIGC 知识库平台架构",
      content:
        "平台分为知识生产层（录入/导入/AI提炼）、知识管理层（分类/检索/状态）、知识消费层（专家 Agent / Skill 导出）。底层使用向量检索增强问答准确性。",
      summary: "本平台三层架构说明",
      tags: JSON.stringify(["AIGC", "架构", "知识库"]),
      category: "技术",
      source: KnowledgeSource.AI_EXTRACT,
    },
  ];

  for (const item of samples) {
    await prisma.knowledge.create({
      data: { ...item, status: KnowledgeStatus.ACTIVE },
    });
  }

  await prisma.agent.create({
    data: {
      name: "企业知识专家",
      description: "基于知识库回答采购、人事、合规等问题",
      systemPrompt:
        "你是字节跳动集团信息系统部的企业知识专家，仅根据提供的知识库片段回答问题。若知识库无相关内容，请明确说明并建议用户联系对应部门。",
      tagFilter: null,
    },
  });

  console.log("Seed completed.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
