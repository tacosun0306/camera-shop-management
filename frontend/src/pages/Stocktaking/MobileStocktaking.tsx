import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, InputNumber, message, Card, Tag, Space, Modal, List } from 'antd';
import { Html5Qrcode } from 'html5-qrcode';
import { CameraOutlined, CheckOutlined, ArrowLeftOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { stocktakingApi } from '../../api/stocktaking';

interface StocktakingDetail {
  id: number;
  product_id: number;
  barcode: string;
  name: string;
  brand: string;
  category: string;
  system_quantity: number;
  actual_quantity: number | null;
  difference: number | null;
  checked?: boolean;
}

const MobileStocktaking: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [details, setDetails] = useState<StocktakingDetail[]>([]);
  const [currentProduct, setCurrentProduct] = useState<StocktakingDetail | null>(null);
  const [quantity, setQuantity] = useState<number>(0);
  const [scanning, setScanning] = useState(false);
  const [html5QrCode, setHtml5QrCode] = useState<Html5Qrcode | null>(null);
  const [showList, setShowList] = useState(false);
  const [stocktakingInfo, setStocktakingInfo] = useState<any>(null);

  useEffect(() => {
    loadStocktaking();
    return () => {
      if (html5QrCode && scanning) {
        html5QrCode.stop().catch(console.error);
      }
    };
  }, [id]);

  const loadStocktaking = async () => {
    try {
      const data: any = await stocktakingApi.getById(Number(id));
      setStocktakingInfo(data);
      const detailsWithCheck = (data.details || []).map((d: StocktakingDetail) => ({
        ...d,
        checked: d.actual_quantity !== null && d.actual_quantity !== 0
      }));
      setDetails(detailsWithCheck);
    } catch (error) {
      message.error('載入盤點單失敗');
      console.error(error);
    }
  };

  const startScanning = async () => {
    try {
      const qrCode = new Html5Qrcode("reader");
      setHtml5QrCode(qrCode);

      await qrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        onScanSuccess,
        () => {} // 掃描錯誤不顯示
      );
      setScanning(true);
    } catch (error) {
      message.error('無法啟動相機，請確認已授權相機權限');
      console.error(error);
    }
  };

  const stopScanning = async () => {
    if (html5QrCode && scanning) {
      try {
        await html5QrCode.stop();
        setScanning(false);
      } catch (error) {
        console.error(error);
      }
    }
  };

  const onScanSuccess = async (decodedText: string) => {
    const product = details.find(d => d.barcode === decodedText);
    
    if (product) {
      setCurrentProduct(product);
      setQuantity(product.actual_quantity || 0);
      await stopScanning();
      message.success(`已掃描：${product.name}`);
    } else {
      message.warning('此商品不在盤點清單中');
    }
  };

  const saveQuantity = async () => {
    if (!currentProduct) return;

    try {
      await stocktakingApi.updateDetail(currentProduct.id, {
        actual_quantity: quantity
      });

      setDetails(prev => prev.map(d => 
        d.id === currentProduct.id 
          ? { 
              ...d, 
              actual_quantity: quantity, 
              difference: quantity - d.system_quantity,
              checked: true 
            }
          : d
      ));

      message.success('已儲存');
      setCurrentProduct(null);
      setQuantity(0);
      
      startScanning();
    } catch (error) {
      message.error('儲存失敗');
      console.error(error);
    }
  };

  const completeStocktaking = async () => {
    const unchecked = details.filter(d => !d.checked);
    
    if (unchecked.length > 0) {
      Modal.confirm({
        title: '確認完成盤點？',
        content: `還有 ${unchecked.length} 項商品未盤點，確定要完成嗎？`,
        onOk: async () => {
          try {
            await stocktakingApi.complete(Number(id));
            message.success('盤點已完成');
            navigate('/stocktaking');
          } catch (error) {
            message.error('完成盤點失敗');
            console.error(error);
          }
        }
      });
    } else {
      try {
        await stocktakingApi.complete(Number(id));
        message.success('盤點已完成');
        navigate('/stocktaking');
      } catch (error) {
        message.error('完成盤點失敗');
        console.error(error);
      }
    }
  };

  const checkedCount = details.filter(d => d.checked).length;
  const totalCount = details.length;
  const progress = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f0f2f5',
      paddingBottom: '80px'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#fff',
        padding: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate('/stocktaking')}
            >
              返回
            </Button>
            <Button 
              icon={<UnorderedListOutlined />} 
              onClick={() => setShowList(true)}
            >
              查看清單
            </Button>
          </Space>
          <div>
            <h3 style={{ margin: 0 }}>盤點單 #{id}</h3>
            <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
              {stocktakingInfo?.branch_name} - {stocktakingInfo?.notes || ''}
            </div>
          </div>
          <div>
            <Tag color="blue">已盤點 {checkedCount}/{totalCount}</Tag>
            <Tag color={progress === 100 ? 'success' : 'processing'}>
              進度 {progress}%
            </Tag>
          </div>
        </Space>
      </div>

      {/* 掃描區域 */}
      <div style={{ padding: '16px' }}>
        {!scanning && !currentProduct && (
          <Card>
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <CameraOutlined style={{ fontSize: '64px', color: '#1890ff', marginBottom: '16px' }} />
              <h2>開始掃描條碼</h2>
              <p style={{ color: '#666', marginBottom: '24px' }}>
                點擊下方按鈕開始掃描商品條碼進行盤點
              </p>
              <Button 
                type="primary" 
                size="large" 
                icon={<CameraOutlined />}
                onClick={startScanning}
                block
              >
                啟動相機掃描
              </Button>
            </div>
          </Card>
        )}

        {scanning && (
          <Card>
            <div id="reader" style={{ width: '100%' }}></div>
            <Button 
              danger 
              block 
              style={{ marginTop: '16px' }}
              onClick={stopScanning}
            >
              停止掃描
            </Button>
          </Card>
        )}

        {currentProduct && (
          <Card>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <h3>{currentProduct.name}</h3>
                <div style={{ color: '#666' }}>
                  <div>條碼：{currentProduct.barcode}</div>
                  <div>品牌：{currentProduct.brand}</div>
                  <div>分類：{currentProduct.category}</div>
                </div>
              </div>

              <div style={{
                backgroundColor: '#f5f5f5',
                padding: '16px',
                borderRadius: '8px'
              }}>
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ color: '#666' }}>系統數量：</span>
                  <span style={{ fontSize: '24px', fontWeight: 'bold', marginLeft: '8px' }}>
                    {currentProduct.system_quantity}
                  </span>
                </div>
                <div style={{ marginTop: '16px' }}>
                  <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>實際數量：</div>
                  <InputNumber
                    value={quantity}
                    onChange={(value) => setQuantity(value || 0)}
                    min={0}
                    size="large"
                    style={{ width: '100%', fontSize: '20px' }}
                    autoFocus
                  />
                </div>
              </div>

              <Space style={{ width: '100%' }} size="middle">
                <Button 
                  size="large"
                  block 
                  onClick={() => {
                    setCurrentProduct(null);
                    setQuantity(0);
                    startScanning();
                  }}
                >
                  取消
                </Button>
                <Button 
                  type="primary" 
                  size="large"
                  block
                  icon={<CheckOutlined />}
                  onClick={saveQuantity}
                >
                  確認儲存
                </Button>
              </Space>
            </Space>
          </Card>
        )}
      </div>

      {/* 底部操作按鈕 */}
      {!scanning && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '16px',
          backgroundColor: '#fff',
          boxShadow: '0 -2px 8px rgba(0,0,0,0.1)'
        }}>
          <Button 
            type="primary" 
            size="large" 
            block
            onClick={completeStocktaking}
            disabled={checkedCount === 0}
          >
            完成盤點 ({checkedCount}/{totalCount})
          </Button>
        </div>
      )}

      {/* 清單 Modal */}
      <Modal
        title="盤點清單"
        open={showList}
        onCancel={() => setShowList(false)}
        footer={null}
        width="90%"
        style={{ top: 20 }}
      >
        <List
          dataSource={details}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                title={
                  <Space>
                    {item.name}
                    {item.checked && <Tag color="success">已盤點</Tag>}
                  </Space>
                }
                description={
                  <div>
                    <div>條碼：{item.barcode}</div>
                    <div>
                      系統：{item.system_quantity} | 
                      實際：{item.actual_quantity !== null ? item.actual_quantity : '-'} |
                      差異：{item.difference !== null ? (
                        <span style={{ 
                          color: item.difference === 0 ? 'green' : 'red',
                          fontWeight: 'bold'
                        }}>
                          {item.difference > 0 ? '+' : ''}{item.difference}
                        </span>
                      ) : '-'}
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Modal>
    </div>
  );
};

export default MobileStocktaking;
